#!/usr/bin/env python3
"""
Script to export organization cybersecurity policies as PDF files.
"""

import re
from pathlib import Path
from fpdf import FPDF


class PolicyPDF(FPDF):
    """Custom PDF class for policy documents"""

    def __init__(self):
        super().__init__()
        self.set_margins(20, 20, 20)
        self.title_text = ""

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, 'AegisCISO - ' + self.title_text[:50], align='R')
            self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')


def clean_markdown(text):
    """Remove markdown formatting"""
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # bold
    text = re.sub(r'\*([^*]+)\*', r'\1', text)  # italic
    text = re.sub(r'`([^`]+)`', r'\1', text)  # code
    return text


def create_policy_pdf(markdown_path, output_path):
    """Convert a markdown policy to PDF"""
    with open(markdown_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pdf = PolicyPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    lines = content.split('\n')
    in_table = False
    table_data = []
    in_code = False
    code_lines = []

    for line in lines:
        stripped = line.strip()

        # Handle code blocks
        if stripped.startswith('```'):
            if in_code:
                # End code block
                if code_lines:
                    pdf.set_font('Courier', '', 8)
                    pdf.set_fill_color(240, 240, 240)
                    for code_line in code_lines:
                        pdf.cell(0, 5, code_line[:80], fill=True, ln=True)
                    pdf.ln(3)
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        # Handle tables
        if '|' in stripped and stripped.startswith('|'):
            cells = [c.strip() for c in stripped.split('|')]
            cells = [c for c in cells if c]  # Remove empty cells

            # Skip separator rows
            if cells and all(set(c) <= set('-:') for c in cells):
                continue

            if cells:
                table_data.append(cells)
                in_table = True
            continue
        elif in_table and table_data:
            # Render table
            render_table(pdf, table_data)
            table_data = []
            in_table = False

        # Handle headings
        if stripped.startswith('# '):
            title = clean_markdown(stripped[2:])
            pdf.title_text = title
            pdf.set_font('Helvetica', 'B', 18)
            pdf.set_text_color(0, 51, 102)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 10, title)
            pdf.ln(5)

        elif stripped.startswith('## '):
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(0, 51, 102)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 8, clean_markdown(stripped[3:]))
            pdf.ln(2)

        elif stripped.startswith('### '):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 12)
            pdf.set_text_color(51, 51, 51)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 7, clean_markdown(stripped[4:]))
            pdf.ln(1)

        elif stripped.startswith('**POL-'):
            # Policy requirement ID
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_fill_color(230, 240, 250)
            pdf.set_text_color(0, 51, 102)
            pdf.set_x(pdf.l_margin)
            text = clean_markdown(stripped)
            pdf.multi_cell(0, 6, text, fill=True)
            pdf.ln(2)

        elif stripped.startswith('- ') or stripped.startswith('* '):
            # Bullet point
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(0, 0, 0)
            pdf.set_x(pdf.l_margin)  # Reset x position
            bullet_text = clean_markdown(stripped[2:])
            pdf.multi_cell(0, 6, '  - ' + bullet_text)

        elif stripped.startswith('---'):
            pdf.ln(3)
            pdf.set_draw_color(200, 200, 200)
            pdf.line(20, pdf.get_y(), pdf.w - 20, pdf.get_y())
            pdf.ln(3)

        elif stripped:
            # Regular text
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(0, 0, 0)
            pdf.set_x(pdf.l_margin)  # Ensure we're at left margin
            try:
                pdf.multi_cell(0, 6, clean_markdown(stripped))
            except Exception as e:
                print(f"Error on line: {stripped[:50]}")
                raise

    # Handle any remaining table
    if table_data:
        render_table(pdf, table_data)

    pdf.output(output_path)
    return True


def render_table(pdf, table_data):
    """Render a table in the PDF"""
    if not table_data:
        return

    pdf.ln(2)
    available_width = pdf.w - pdf.l_margin - pdf.r_margin

    # Calculate column widths based on content
    num_cols = max(len(row) for row in table_data)
    col_width = available_width / num_cols

    for i, row in enumerate(table_data):
        if i == 0:
            # Header row
            pdf.set_font('Helvetica', 'B', 8)
            pdf.set_fill_color(0, 51, 102)
            pdf.set_text_color(255, 255, 255)
        else:
            pdf.set_font('Helvetica', '', 8)
            pdf.set_fill_color(250, 250, 250)
            pdf.set_text_color(0, 0, 0)

        for j, cell in enumerate(row):
            text = clean_markdown(str(cell))[:45]
            pdf.cell(col_width, 6, text, border=1, fill=True)

        pdf.ln()
        pdf.set_x(pdf.l_margin)  # Reset x position

    pdf.set_text_color(0, 0, 0)
    pdf.set_x(pdf.l_margin)  # Reset x position after table
    pdf.ln(3)


def main():
    """Main function to export all policies as PDFs"""
    print("=" * 60)
    print("AegisCISO Policy PDF Exporter")
    print("=" * 60)
    print()

    # Setup paths
    base_dir = Path(__file__).parent.parent
    policies_dir = base_dir / "data" / "policies"
    pdf_output_dir = base_dir / "data" / "policies" / "pdf"

    # Create output directory
    pdf_output_dir.mkdir(parents=True, exist_ok=True)

    # Get all markdown policy files
    policy_files = sorted(policies_dir.glob("*.md"))

    if not policy_files:
        print("No policy files found!")
        return

    print(f"Found {len(policy_files)} policies to export")
    print(f"Output directory: {pdf_output_dir}")
    print()

    success_count = 0
    fail_count = 0

    for policy_file in policy_files:
        pdf_name = policy_file.stem + ".pdf"
        pdf_path = pdf_output_dir / pdf_name

        print(f"Exporting: {policy_file.name}")
        try:
            create_policy_pdf(policy_file, pdf_path)
            print(f"  -> {pdf_name}")
            success_count += 1
        except Exception as e:
            import traceback
            print(f"  ERROR: {str(e)}")
            traceback.print_exc()
            fail_count += 1
            break  # Stop on first error to see traceback

    print()
    print("=" * 60)
    print("Export Complete")
    print("=" * 60)
    print(f"  Successful: {success_count}")
    print(f"  Failed: {fail_count}")
    print(f"  Output: {pdf_output_dir}")


if __name__ == "__main__":
    main()
