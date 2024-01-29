
const soap=require('soap')
async function tcKimlikNoDogrula(tc, ad,soad,dy) {
    return new Promise((resolve, reject) => {
      const url = 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx?wsdl';
      const args = { TCKimlikNo: tc, Ad: ad,Soyad:soad,DogumYili:dy };
  
      soap.createClient(url, (err, clients) => {
        if (err) {
          console.error(err);
          reject(err);
        }
  
        clients.TCKimlikNoDogrula(args, (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          }
  
          // TC kimlik doğrulamasının sonucu
          const dogrulandi = result && result.TCKimlikNoDogrulaResult;
  
          resolve(dogrulandi);
        });
      });
    });
  }

  // Yukarıdaki fonksiyonun örnek kullanımı
const tcKimlikNoDogrulas = async (TCKimlikNo, Ad, Soyad, DogumYili) => {
    try {
      const dogrulandi = await tcKimlikNoDogrula(TCKimlikNo, Ad, Soyad, DogumYili);
      console.log('TC Kimlik Doğrulama Sonucu:', dogrulandi);
    } catch (error) {
      console.error('Hata:', error);
    }
  };
  
  // Kullanım örneği
 
  
tcKimlikNoDogrulas('12423093644', 'Fevzi Berat', 'Durdağı', 2002);