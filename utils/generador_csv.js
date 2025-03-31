var FileStream = require('fs').promises;
const Process = require('./Process');

function random_number(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function random_text(characters_num, includeNumbers = false) {
    let text = "";
    for (let i = 0; i < characters_num; i++) {
        if (includeNumbers && Math.random() < 0.5) {
            text += String(random_number(0, 9));
        } else {
            text += String.fromCharCode(random_number(65, 90));
        }
    }

    return text;
}

async function getLicenses() {
    const licenseMysql = new Process("mysql");
    licenseMysql.ProcessArguments.push("-uroot");
    licenseMysql.ProcessArguments.push("--password=22194");
    licenseMysql.Execute();
    licenseMysql.Write("use ProyectoBD;");
    licenseMysql.Write("select license from Autor;");
    licenseMysql.End();
    await licenseMysql.Finish();

    const licenses = licenseMysql.outs.split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed !== '' && trimmed !== 'license' && !line.includes('mysql: [Warning]');
    })
    .map(line => line.trim());

    return licenses;
}

async function generate_AuthorsCsv(size) {
    let csv = "";
    let licenses = new Set();

    for (let i = 0; i < size; i++) {
        let license;
        
        do {
            license = random_text(12, true);
        } while (licenses.has(license)); 
        
        licenses.add(license);

        const id =  Math.random().toFixed(7).toString().replace('.', '');
        const name = random_text(random_number(5, 20));
        const lastname = random_text(random_number(5, 20));
        const secondLastName = random_text(random_number(5, 20));
        const year = random_number(1960, 2000);

        csv += `${id},${license},${name},${lastname},${secondLastName},${year}\n`;
    }
    return csv
}

async function generate_BooksCsv(size){
    let csv = "";
    const licenses = await getLicenses();

    if (licenses.length === 0) {
        throw new Error("No hay licencias disponibles para generar los libros.");
    }

    for (let i = 0; i < size; i++) {
        const id = Math.random().toFixed(7).toString().replace('.', '');
        const ISBN = random_text(16, true);
        const title = random_text(random_number(5, 20));
        const autor_license = licenses[Math.floor(Math.random() * licenses.length)];
        const editorial = random_text(random_number(5, 30));
        const pages = random_number(1, 1000);
        const year = random_number(1960, 2024);
        const genre = random_text(random_number(5, 20));
        const language = random_text(random_number(5, 15));
        const format = random_text(random_number(3, 10));
        const sinopsis = random_text(random_number(5, 50));
        const content = random_text(random_number(5, 50));

        csv += `${id},${ISBN},${title},${autor_license},${editorial},${pages},${year},${genre},${language},${format},${sinopsis},${content}\n`
    }
    return csv    
}

async function generate_Autorfiles(numFiles, size) {
    for (let i = 1; i <= numFiles; i++) {
        const csvData = await generate_AuthorsCsv(size);
        const filePath = `C:\\ProgramData\\MySQL\\MySQL Server 9.1\\Uploads\\Autores${i}.csv`;
        try {
            await FileStream.writeFile(filePath, csvData);
        } catch (error) {
            console.error(`Error escribiendo el archivo ${filePath}:`, error);
        }
    }
}

async function generate_Bookfiles(numFiles, size, fileName) {
    for(let i= 1; i <= numFiles; i++){
        const csvData = await generate_BooksCsv(size);
        const filePath = `C:\\ProgramData\\MySQL\\MySQL Server 9.1\\Uploads\\${fileName}${i}.csv`;  

        try {
            await FileStream.writeFile(filePath, csvData);
        } catch (error) {
            console.error(`Error escribiendo el archivo ${filePath}:`, error);
        }
    }
}

module.exports = {
    random_number: random_number,
    random_text: random_text,
    generate_Autorfiles: generate_Autorfiles,
    generate_Bookfiles: generate_Bookfiles,
};