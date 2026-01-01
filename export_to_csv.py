import json
import csv
import argparse
from pathlib import Path
from datetime import datetime


def export_json_records_to_csv(json_path, csv_path, add_export_date=False, export_field_name='exportedAt'):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Expecting records under 'records' key, fallback to top-level list
    records = data.get('records') if isinstance(data, dict) else data
    if records is None:
        raise ValueError('No records found in JSON file')

    # Determine CSV headers as union of all keys in records
    headers = []
    for r in records:
        for k in r.keys():
            if k not in headers:
                headers.append(k)

    # Optionally add an export timestamp column
    if add_export_date and export_field_name not in headers:
        headers.append(export_field_name)

    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        now_iso = datetime.now().isoformat() if add_export_date else None
        for r in records:
            row = {k: r.get(k, '') for k in headers}
            if add_export_date:
                row[export_field_name] = now_iso
            writer.writerow(row)


def main():
    parser = argparse.ArgumentParser(description='Export JSON records to CSV')
    parser.add_argument('input', help='Input JSON file (with "records" array)')
    parser.add_argument('output', nargs='?', help='Output CSV file (default: same folder/sample-data.csv)')
    parser.add_argument('--add-export-date', action='store_true', help='Add current export timestamp column to CSV')
    parser.add_argument('--export-field-name', default='exportedAt', help='Column name for export timestamp')
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f'Input file not found: {in_path}')
        return

    out_path = Path(args.output) if args.output else in_path.with_name('sample-data.csv')

    try:
        export_json_records_to_csv(in_path, out_path, add_export_date=args.add_export_date, export_field_name=args.export_field_name)
        print(f'Wrote CSV: {out_path}')
    except Exception as e:
        print('Error exporting CSV:', e)


if __name__ == '__main__':
    main()
