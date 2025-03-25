var FileStream = require('fs');
const Process = require('./Process');

function random_number(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function random_text(characters_num, includeNumbers = false) {
    let text = "";
    for(let i = 0; i < characters_num; i++) {
       if(includeNumbers && Math.random() < 0.5){
        text += random_number(0,9);
       }else{
        text += String.fromCharCode(random_number(65, 89));
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
        .filter(line => line.trim() !== '' && line.trim() !== 'license' && line.trim() !== '0' && !line.includes('mysql: [Warning]'))
        .map(line => line.trim());

    return licenses;
}

function generate_AuthorsCsv(size, stream) {
    let csv = "";
    const startTime = Date.now();
    // let licenses = []; ---> usando el csv de autores
    let _stream = stream ? FileStream.createWriteStream(stream, {flags: 'w'}) : null;

    for (let i = 0; i < size; i++) {
        const id = i+1;
        const license = random_text(12, true);
        const name = random_text(random_number(5, 20));
        const lastname = random_text(random_number(5, 20));
        const secondLastName = random_text(random_number(5, 20));
        const year = random_number(1960, 2000);

        // licenses.push(license); ---> usando el csv de autores

        if(stream){
            _stream.write(`${id},${license},${name},${lastname},${secondLastName},${year}\n`);
        }else{
            csv += `${id},${license},${name},${lastname},${secondLastName},${year}\n`
        }
    }

    if(!stream){
        return {csv};
        // return {csv, licenses}; ---> usando el csv de autores
    }

    _stream.close();
    // return licenses; ---> usando el csv de autores
}

async function generate_BooksCsv(size, stream){ // PARA GENERARLOS A PARTIR DE UN CSV DE AUTORES PON EL PARAMETRO: authorsLicenses y quita el async :)
    let csv = "";
    let _stream = stream ? FileStream.createWriteStream(stream, {flags: 'w'}) : null;
    const licenses = await getLicenses();

    for (let i = 0; i < size; i++) {
        const id = i+1;
        const ISBN = random_text(16, true);
        const title = random_text(random_number(5, 20));
        // const autor_license = authorsLicenses[random_number(0, authorsLicenses.length - 1)]; --->  usando el csv de autores
        const autor_license = licenses[Math.floor(Math.random() * licenses.length)];
        const editorial = random_text(random_number(5, 30));
        const pages = random_number(0, 1000);
        const year = random_number(1960, 2024);
        const genre = random_text(random_number(5, 20));
        const language = random_text(random_number(5, 15));
        const format = random_text(random_number(3, 10));
        const sinopsis = random_text(random_number(5, 50));
        const content = random_text(random_number(5, 50));

        if(stream){
            _stream.write(`${id},${ISBN},${title},${autor_license},${editorial},${pages},${year},${genre},${language},${format},${sinopsis},${content}\n`);
        }else{
            csv += `${id},${ISBN},${title},${autor_license},${editorial},${pages},${year},${genre},${language},${format},${sinopsis},${content}\n`
        }
    }

}

module.exports = {
    random_number: random_number,
    random_text: random_text,
    generate_AuthorsCsv: generate_AuthorsCsv,
    generate_BooksCsv: generate_BooksCsv,
};