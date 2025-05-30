export function generateUniqueReferralCode(fullName) {
  // Gera um código baseado no nome
  const nameParts = fullName.split(' ');
  let baseCode = '';
  
  // Pega a primeira letra de cada parte do nome
  nameParts.forEach(part => {
    if (part.length > 0) {
      baseCode += part[0].toUpperCase();
    }
  });
  
  // Adiciona um timestamp para garantir unicidade
  const timestamp = new Date().getTime().toString().slice(-6);
  
  // Adiciona um número aleatório para mais unicidade
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Combina tudo para criar o código final
  return `${baseCode}${timestamp}${randomNum}`;
}