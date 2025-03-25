const generadores = require('./utils/generador_datos');

const fileNum = 1;

for(let i= 1; i <= fileNum; i++){
    const authorFilePath = `./exports/Authors csv/Autores_${i}.csv`;
    const bookFilePath = `./exports/Books csv/Libros_${i}.csv`;
    // const authorsLicenses = generadores.generate_AuthorsCsv(300, authorFilePath); --->  usando el csv de autores

    generadores.generate_AuthorsCsv(2, authorFilePath);
    generadores.generate_BooksCsv(5, bookFilePath);
    //generadores.generate_BooksCsv(5, authorsLicenses, bookFilePath); --->  usando el csv de autores
}
console.log("Archivos generados");