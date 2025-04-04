export async function generateDocument(files: File[], modelo: string): Promise<string> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('documentos', file);
  }

  formData.append('modelo', modelo);

  const response = await fetch('https://documentum-ia-api.seunome.repl.co/api/gerar-minuta', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro da API:', errorText);
    throw new Error('Erro ao gerar documento');
  }

  const data = await response.json();
  return data.minuta;
}
