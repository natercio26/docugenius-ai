
export async function generateDocument(files: File[], modelTemplate?: string): Promise<string> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('documentos', file);
  }

  if (modelTemplate) {
    formData.append('modelo', modelTemplate);
  }

  const response = await fetch('https://documentum-ia-api.timelegal4455.repl.co/api/gerar-minuta', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Erro na API:', err);
    throw new Error('Erro ao gerar minuta');
  }

  const data = await response.json();
  return data.minuta;
}
