
from flask import Flask, request, send_file
import pytesseract
from pdf2image import convert_from_bytes
import tempfile
import re
from fpdf import FPDF
import os

app = Flask(__name__)

VARIAVEIS = [
    "¿qualificacao_do(a)_viuvo(a)>", "§2herdeiro§-§2filho§", "¿qualificacao_do(a)(s)_herdeiro(a)(s)>", "¿nome_do_advogado>",
    "¿nome_do_\"de_cujus\">", "¿nome_do_autor_da_heranca>", "¿qualificacao_do_autor_da_heranca>", "¿nome_do(a)_viuva(o)-meeira(o)>",
    "¿regime>", "¿data_do_casamento>", "¿data_de_expedicao_casamento>", "¿nº_da_matricula_da_cert._obito>", "¿oficio_do_cartorio>",
    "¿data_do_falecimento_autor_heranca>", "¿nome_do_hospital>", "¿cidade>", "¿data_de_expedicao_obito>", "¿nº_do_termo>",
    "¿livro>", "¿fls>", "¿cartorio>", "¿data_de_expedicao>", "¿quantidade_de_filhos>", "¿nome_dos_filhos>", "¿DESCRICAO_DO(S)_BEM(NS)>",
    "¿MATRICULA_Nº>", "¿modo_de_aquisicao>", "¿REGISTRO_Nº>", "¿valor>", "¿VALOR_R$>", "¿monte_mor>", "¿nome_do(a)_viuvo(a)>",
    "¿valor_da_meacao>", "¿incluir_o_nome_dos_herdeiros>", "¿incluir_o_percentual>", "¿incluir_valor_que_pertence_a_cada_herdeiro>"
]

def extract_text_with_ocr(file_path):
    images = convert_from_path(file_path)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(img, lang='por') + "\n"
    return text

def preencher_variaveis(modelo, texto):
    for var in VARIAVEIS:
        padrao_limpo = re.escape(var).replace("\\¿", "").replace("\\>", "")
        encontrado = re.search(f"{padrao_limpo}.*?:\s*(.*)", texto, re.IGNORECASE)
        valor = encontrado.group(1).strip() if encontrado else "DADO NÃO ENCONTRADO"
        modelo = modelo.replace(var, valor)
    return modelo

@app.route('/gerar-minuta', methods=['POST'])
def gerar_minuta():
    files = request.files.getlist("files")
    modelo_minuta = request.form.get("modelo_minuta")

    texto_geral = ""
    for f in files:
        text = extract_text_with_ocr(f)
        texto_geral += f"\n--- {f.filename} ---\n{text}"

    texto_final = preencher_variaveis(modelo_minuta, texto_geral)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)

    for line in texto_final.split("\n"):
        pdf.multi_cell(0, 10, line)

    temp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(temp.name)

    return send_file(temp.name, as_attachment=True, download_name='minuta_final.pdf')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
