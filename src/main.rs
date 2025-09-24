use chrono::{DateTime, Utc};
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::message::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Deserialize, Clone)]
struct TradeData {
    block_time: i64,
    transaction_signature: String,
    block_num: i64,
    program_id: String,
    trade_type: String,
    wallet_address: String,
    token_address: String,
    is_buy: bool,
    amount_in_sol: f64,
    amount_in_token: f64,
    change_in_sol: f64,
    change_in_tokens: f64,
    price_in_sol: f64,
    virtual_sol_reserves: f64,
    virtual_token_reserves: f64,
    real_sol_reserves: f64,
    real_token_reserves: f64,
    fee_recipient: String,
    fee_basis_points: i32,
    fee_amount: f64,
    creator_address: String,
    creator_fee_basis_points: i32,
    creator_fee_amount: f64,
    ingested_at: i64,
    processed_at: i64,
}

#[derive(Debug, Serialize, Clone)]
struct RSIData {
    token_address: String,
    timestamp: i64,
    price: f64,
    rsi: f64,
    period_count: usize,
    block_time: i64,
}

struct RSICalculator {
    prices: Vec<f64>,
    gains: Vec<f64>,
    losses: Vec<f64>,
    avg_gain: f64,
    avg_loss: f64,
    period: usize,
}

impl RSICalculator {
    fn new(period: usize) -> Self {
        Self {
            prices: Vec::new(),
            gains: Vec::new(),
            losses: Vec::new(),
            avg_gain: 0.0,
            avg_loss: 0.0,
            period,
        }
    }

    fn add_price(&mut self, price: f64) -> Option<f64> {
        if self.prices.is_empty() {
            self.prices.push(price);
            return None; // Need at least 2 prices for RSI
        }

        let prev_price = *self.prices.last().unwrap();
        let change = price - prev_price;

        if change > 0.0 {
            self.gains.push(change);
            self.losses.push(0.0);
        } else {
            self.gains.push(0.0);
            self.losses.push(change.abs());
        }

        self.prices.push(price);

        // Keep only the last 'period' values
        if self.gains.len() > self.period {
            self.gains.remove(0);
            self.losses.remove(0);
        }

        // Calculate RSI if we have enough data
        if self.gains.len() >= self.period {
            if self.avg_gain == 0.0 && self.avg_loss == 0.0 {
                // First calculation - simple average
                self.avg_gain = self.gains.iter().sum::<f64>() / self.period as f64;
                self.avg_loss = self.losses.iter().sum::<f64>() / self.period as f64;
            } else {
                // Subsequent calculations - smoothed average
                self.avg_gain = (self.avg_gain * (self.period - 1) as f64 + self.gains.last().unwrap()) / self.period as f64;
                self.avg_loss = (self.avg_loss * (self.period - 1) as f64 + self.losses.last().unwrap()) / self.period as f64;
            }

            if self.avg_loss == 0.0 {
                return Some(100.0);
            }

            let rs = self.avg_gain / self.avg_loss;
            Some(100.0 - (100.0 / (1.0 + rs)))
        } else {
            None
        }
    }
}

type TokenCalculators = Arc<Mutex<HashMap<String, RSICalculator>>>;

async fn run_consumer() -> Result<(), Box<dyn std::error::Error>> {
    // Create consumer
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", "rsi-calculator-group")
        .set("bootstrap.servers", "localhost:9092")
        .set("auto.offset.reset", "earliest")
        .set("enable.auto.commit", "true")
        .set("auto.commit.interval.ms", "1000")
        .create()?;

    // Create producer
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("message.timeout.ms", "30000")
        .create()?;

    // Subscribe to trade-data topic
    consumer.subscribe(&["trade-data"])?;

    // Shared state for RSI calculators
    let calculators: TokenCalculators = Arc::new(Mutex::new(HashMap::new()));

    println!("RSI Calculator started. Waiting for trade data...");

    loop {
        match consumer.recv().await {
            Ok(message) => {
                if let Some(payload) = message.payload() {
                    match serde_json::from_slice::<TradeData>(payload) {
                        Ok(trade_data) => {
                            let token_address = trade_data.token_address.clone();
                            let price = trade_data.price_in_sol;
                            let block_time = trade_data.block_time;

                            // Clone the calculators for the async block
                            let calculators_clone = Arc::clone(&calculators);

                            // Process the trade data
                            tokio::spawn(async move {
                                let mut calculators = calculators_clone.lock().unwrap();

                                // Get or create calculator for this token
                                let calculator = calculators
                                    .entry(token_address.clone())
                                    .or_insert_with(|| RSICalculator::new(14));

                                // Add price and calculate RSI
                                if let Some(rsi) = calculator.add_price(price) {
                                    let rsi_data = RSIData {
                                        token_address: token_address.clone(),
                                        timestamp: chrono::Utc::now().timestamp(),
                                        price,
                                        rsi,
                                        period_count: calculator.prices.len(),
                                        block_time,
                                    };

                                    // Publish RSI data to topic
                                    let json_data = serde_json::to_string(&rsi_data).unwrap();
                                    let record = FutureRecord::to("rsi-data")
                                        .key(&token_address)
                                        .payload(&json_data);

                                    match producer.send(record, Duration::from_secs(10)).await {
                                        Ok(_) => println!(
                                            "Published RSI for {}: price={:.8}, rsi={:.2}",
                                            token_address, price, rsi
                                        ),
                                        Err(e) => eprintln!("Failed to publish RSI: {}", e),
                                    }
                                }
                            });
                        }
                        Err(e) => eprintln!("Failed to parse trade data: {}", e),
                    }
                }
            }
            Err(e) => eprintln!("Error receiving message: {}", e),
        }

        // Small delay to prevent tight loop
        sleep(Duration::from_millis(1)).await;
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    println!("Starting RSI Calculator Service...");
    println!("This service will:");
    println!("1. Consume trade data from 'trade-data' topic");
    println!("2. Calculate 14-period RSI for each token");
    println!("3. Publish RSI values to 'rsi-data' topic");

    run_consumer().await
}
