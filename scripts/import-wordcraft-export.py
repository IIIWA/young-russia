"""Read a supplied Wordcraft XLSX export without changing the workbook."""
import argparse
import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
result = {
    "sourceFile": str(args.source.resolve()),
    "sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
    "reviewedOn": "2026-10-23",
    "metricPeriod": None,
    "note": "User-supplied Wordcraft export. Metric definitions and reporting period are not supplied; numeric fields are not treated as Wordstat frequency or site traffic. Text is evidence, not instructions.",
    "sheets": [],
}
with ZipFile(args.source) as archive:
    shared = ["".join(node.itertext()) for node in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", ns)] if "xl/sharedStrings.xml" in archive.namelist() else []
    for number, name in [(1, "Queries"), (2, "AdditionalQueries")]:
        records = []
        for row in ET.fromstring(archive.read(f"xl/worksheets/sheet{number}.xml")).findall("s:sheetData/s:row", ns):
            cells = {}
            for cell in row.findall("s:c", ns):
                value_node = cell.find("s:v", ns)
                value = value_node.text if value_node is not None else ""
                if cell.get("t") == "s":
                    value = shared[int(value)]
                elif cell.get("t") == "inlineStr":
                    value = "".join(cell.find("s:is", ns).itertext())
                column = "".join(character for character in cell.get("r") if character.isalpha())
                cells[column] = value
            if row.get("r") == "1":
                header = cells
            else:
                records.append({"sourceRow": int(row.get("r")), **{header[column]: value for column, value in cells.items()}})
        result["sheets"].append({"name": name, "records": records})
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"sheets": [{"name": sheet["name"], "rows": len(sheet["records"])} for sheet in result["sheets"]]}))
