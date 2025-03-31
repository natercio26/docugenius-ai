
from flask import Flask, request, send_file
from fpdf import FPDF
import tempfile
import os

app = Flask(__name__)

@app.route('/gerar-minuta', methods=['POST'])
def gerar_minuta():
    files = request.files.getlist("files")
    modelo_minuta = request.form.get("modelo_minuta")

    # Create a simple PDF with the model template
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    
    # Add file names and template to PDF
    pdf.multi_cell(0, 10, "Arquivos recebidos:")
    for f in files:
        pdf.multi_cell(0, 10, f"- {f.filename}")
    
    pdf.multi_cell(0, 10, "\nModelo da Minuta:")
    pdf.multi_cell(0, 10, modelo_minuta)

    # Save PDF to temporary file
    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(temp.name)

    return send_file(temp.name, as_attachment=True, download_name='minuta_final.pdf')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
