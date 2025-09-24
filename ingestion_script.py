#!/usr/bin/env python3
"""
Data Ingestion Script for Pump.fun Trading Data
Loads CSV data into Redpanda trade-data topic
"""

import csv
import json
import time
from datetime import datetime
from kafka import KafkaProducer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_producer():
    """Create Kafka producer with proper configuration for Redpanda"""
    try:
        producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda v: str(v).encode('utf-8') if v else None,
            acks='all',
            retries=3,
            request_timeout_ms=30000,
            delivery_timeout_ms=30000
        )
        logger.info("Successfully connected to Redpanda at localhost:9092")
        return producer
    except Exception as e:
        logger.error(f"Failed to create producer: {e}")
        raise

def parse_csv_row(row):
    """Parse CSV row into structured trade data"""
    try:
        return {
            'block_time': int(row['block_time']),
            'transaction_signature': row['transaction_signature'],
            'block_num': int(row['block_num']),
            'program_id': row['program_id'],
            'trade_type': row['trade_type'],
            'wallet_address': row['wallet_address'],
            'token_address': row['token_address'],
            'is_buy': row['is_buy'].lower() == 'true',
            'amount_in_sol': float(row['amount_in_sol']) if row['amount_in_sol'] else 0.0,
            'amount_in_token': float(row['amount_in_token']) if row['amount_in_token'] else 0.0,
            'change_in_sol': float(row['change_in_sol']) if row['change_in_sol'] else 0.0,
            'change_in_tokens': float(row['change_in_tokens']) if row['change_in_tokens'] else 0.0,
            'price_in_sol': float(row['price_in_sol']) if row['price_in_sol'] else 0.0,
            'virtual_sol_reserves': float(row['virtual_sol_reserves']) if row['virtual_sol_reserves'] else 0.0,
            'virtual_token_reserves': float(row['virtual_token_reserves']) if row['virtual_token_reserves'] else 0.0,
            'real_sol_reserves': float(row['real_sol_reserves']) if row['real_sol_reserves'] else 0.0,
            'real_token_reserves': float(row['real_token_reserves']) if row['real_token_reserves'] else 0.0,
            'fee_recipient': row['fee_recipient'],
            'fee_basis_points': int(row['fee_basis_points']) if row['fee_basis_points'] else 0,
            'fee_amount': float(row['fee_amount']) if row['fee_amount'] else 0.0,
            'creator_address': row['creator_address'],
            'creator_fee_basis_points': int(row['creator_fee_basis_points']) if row['creator_fee_basis_points'] else 0,
            'creator_fee_amount': float(row['creator_fee_amount']) if row['creator_fee_amount'] else 0.0,
            'ingested_at': int(row['ingested_at']) if row['ingested_at'] else 0,
            'processed_at': int(datetime.now().timestamp())
        }
    except Exception as e:
        logger.error(f"Error parsing row: {e}")
        return None

def publish_trades(producer, csv_file_path):
    """Read CSV file and publish trades to Redpanda"""
    topic = 'trade-data'

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)

            total_trades = 0
            successful_publishes = 0

            logger.info(f"Starting to publish trades from {csv_file_path} to topic '{topic}'")

            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
                try:
                    # Parse the row
                    trade_data = parse_csv_row(row)
                    if trade_data is None:
                        logger.warning(f"Skipping row {row_num} due to parsing error")
                        continue

                    # Use token_address as the key for partitioning
                    key = trade_data['token_address']

                    # Publish to Redpanda
                    future = producer.send(topic, key=key, value=trade_data)

                    # Wait for the message to be delivered
                    future.get(timeout=10)

                    successful_publishes += 1
                    total_trades += 1

                    # Log progress every 100 trades
                    if total_trades % 100 == 0:
                        logger.info(f"Published {total_trades} trades...")

                    # Small delay to avoid overwhelming the broker
                    time.sleep(0.01)

                except Exception as e:
                    logger.error(f"Error publishing row {row_num}: {e}")
                    total_trades += 1
                    continue

            logger.info("Finished publishing trades to Redpanda")
            logger.info(f"Total trades processed: {total_trades}")
            logger.info(f"Successfully published: {successful_publishes}")
            logger.info(f"Failed publishes: {total_trades - successful_publishes}")

    except FileNotFoundError:
        logger.error(f"CSV file not found: {csv_file_path}")
    except Exception as e:
        logger.error(f"Error reading CSV file: {e}")

def main():
    """Main function"""
    csv_file_path = 'trades_data.csv'

    try:
        # Create producer
        producer = create_producer()

        # Publish trades
        publish_trades(producer, csv_file_path)

        # Close producer
        producer.close()
        logger.info("Producer closed successfully")

    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
