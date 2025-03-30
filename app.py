
from flask import Flask, request, send_file
import pytesseract
from pdf2image import convert_from_bytes
import pdfplumber
import tempfile
import re
from fpdf import FPDF
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

VARIAVEIS = [
    "¿qualificacao_do(a)_viuvo(a)>", "§2herdeiro§-§2filho§", "¿qualificacao_do(a)(s)_herdeiro(a)(s)>", "¿nome_do_advogado>",
    "¿nome_do_\"de_cujus\">", "¿nome_do_autor_da_heranca>", "¿qualificacao_do_autor_da_heranca>", "¿nome_do(a)_viuva(o)-meeira(o)>",
    "¿regime>", "¿data_do_casamento>", "¿data_de_expedicao_casamento>", "¿nº_da_matricula_da_cert._obito>", "¿oficio_do_cartorio>",
    "¿data_do_falecimento_autor_heranca>", "¿nome_do_hospital>", "¿cidade>", "¿data_de_expedicao_obito>", "¿nº_do_termo>",
    "¿livro>", "¿fls>", "¿cartorio>", "¿data_de_expedicao>", "¿quantidade_de_filhos>", "¿nome_dos_filhos>", "¿DESCRICAO_DO(S)_BEM(NS)>",
    "¿MATRICULA_Nº>", "¿modo_de_aquisicao>", "¿REGISTRO_Nº>", "¿valor>", "¿VALOR_R$>", "¿monte_mor>", "¿nome_do(a)_viuvo(a)>",
    "¿valor_da_meacao>", "¿incluir_o_nome_dos_herdeiros>", "¿incluir_o_percentual>", "¿incluir_valor_que_pertence_a_cada_herdeiro>"
]

def extract_text_from_pdf(file_bytes):
    text = ""
    try:
        with pdfplumber.open(file_bytes) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting text with pdfplumber: {e}")
        # Try OCR as fallback
        text = extract_text_with_ocr(file_bytes)
    return text

def extract_text_with_ocr(file_bytes):
    try:
        if hasattr(file_bytes, 'read'):
            file_content = file_bytes.read()
        else:
            file_content = file_bytes
            
        images = convert_from_bytes(file_content)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img, lang='por') + "\n"
        return text
    except Exception as e:
        print(f"Error with OCR extraction: {e}")
        return ""

def preencher_variaveis(modelo, texto):
    for var in VARIAVEIS:
        padrao_limpo = re.escape(var).replace("\\¿", "").replace("\\>", "")
        encontrado = re.search(f"{padrao_limpo}.*?:\s*(.*)", texto, re.IGNORECASE)
        valor = encontrado.group(1).strip() if encontrado else "DADO NÃO ENCONTRADO"
        modelo = modelo.replace(var, valor)
    return modelo

@app.route('/gerar-minuta', methods=['POST'])
def gerar_minuta():
    try:
        files = request.files.getlist("files")
        modelo_minuta = request.form.get("modelo_minuta")

        if not files:
            return {"error": "Nenhum arquivo enviado"}, 400
            
        if not modelo_minuta:
            return {"error": "Modelo da minuta não fornecido"}, 400

        texto_geral = ""
        for f in files:
            try:
                texto = extract_text_from_pdf(f)
                texto_geral += f"\n--- {f.filename} ---\n{texto}"
            except Exception as e:
                print(f"Error processing file {f.filename}: {e}")
                texto_geral += f"\n--- {f.filename} ---\nErro ao processar arquivo\n"

        texto_final = preencher_variaveis(modelo_minuta, texto_geral)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font("Arial", size=12)

        for line in texto_final.split("\n"):
            pdf.multi_cell(0, 10, line)

        temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        pdf.output(temp.name)

        return send_file(
            temp.name, 
            as_attachment=True, 
            download_name='minuta_gerada.pdf',
            mimetype='application/pdf'
        )
            
    except Exception as e:
        print(f"Error generating document: {e}")
        return {"error": f"Erro ao gerar minuta: {str(e)}"}, 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
