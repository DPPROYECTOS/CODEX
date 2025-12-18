
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzFXFIWMCu54KVIslnub8KtWzLjnMIcAnUfv9Pvwnfe7y6QzEi8Dk7fX57A4FpZHxNWDA/exec';

export const googleDriveService = {
  /**
   * Sube un archivo a Google Drive mediante el script GAS desplegado.
   * @param file Objeto File de JavaScript
   * @param folderId ID opcional de la carpeta destino (si no se envía, usa la del script)
   */
  async uploadToDrive(file: File, folderId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          const payload = {
            file: base64Data,
            fileName: file.name,
            mimeType: file.type,
            folderId: folderId || "" // Opcional
          };

          const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          
          if (result.status === 'success') {
            resolve(result);
          } else {
            reject(result.message);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};
