const Process = require("./Process");
const generador = require("./generador_csv")

const random_number = generador.random_number;
const random_text = generador.random_text;

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

async function mysql_insertAutor(threads, repeticiones) {
    let count = threads;
    let licenses = new Set();

    return new Promise(async (resolve, reject) => {
        for (let p = 0; p < threads; p++) {
            const mysql = new Process("mysql", {
                shell: true
            });
            mysql.ProcessArguments.push("-uroot");
            mysql.ProcessArguments.push("--password=22194");
            mysql.Execute();
            mysql.Write("use ProyectoBD;");
            mysql.Write('\n');

            for (let i = 0; i < repeticiones; i++) {
                const id = Math.floor(Math.random() * 10000);
                let license;

                do {
                    license = random_text(12, true);
                } while (licenses.has(license)); 

                licenses.add(license);

                const name = random_text(random_number(5, 20));
                const lastname = random_text(random_number(5, 20));
                const secondLastName = random_text(random_number(5, 20));
                const year = random_number(1960, 2000);

                await mysql.Write(`INSERT INTO Autor VALUES('${id}', '${license}', '${name}', '${lastname}', '${secondLastName}', ${year});`);
                await mysql.Write('\n');
            }

            await mysql.End();
            await mysql.Finish();
            count--;

            if (count === 0) {
                resolve(true);
            }
        }
    });
}

async function mysql_insertLibro(threads, repeticiones) {
    let count = threads;
    const licenses = await getLicenses();

    return new Promise(async (resolve, reject) => {
        for (let p = 0; p < threads; p++) {
            const mysql = new Process("mysql", {
                shell: true
            });
            mysql.ProcessArguments.push("-uroot");
            mysql.ProcessArguments.push("--password=22194");
            mysql.Execute();
            mysql.Write("use ProyectoBD;");
            mysql.Write('\n');

            for (let i = 0; i < repeticiones; i++) {
                const id = random_number(1, 2000);
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
                await mysql.Write(`INSERT INTO Libro VALUES('${id}', '${ISBN}', '${title}', '${autor_license}', '${editorial}', ${pages}, ${year}, '${genre}', '${language}', '${format}', '${sinopsis}', '${content}');`);
                await mysql.Write('\n');
            }

            await mysql.End();
            await mysql.Finish();
            count--;

            if (count === 0) {
                resolve(true);
            }
        }
    });
}

async function mongo_insertLibro(threads, repeticiones) {
    let count = threads;
    const licenses = await getLicenses();
    
    return new Promise(async (resolve, reject) => {
        for(let p = 0; p < threads; p++) {
            (async () => {
                const mongo = new Process("mongosh", {
                    shell: true
                });
                mongo.Execute();
                mongo.Write("use ProyectoBD;");
                mongo.Write('\n');
        
                for(let i = 0; i < repeticiones; i++) {
                    const id = random_number(1, 2000);
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
                    const insert = `db.ProyectoBD.insertOne({id: '${id}', ISBN: ${ISBN}, title: '${title}', autor_license: '${autor_license}', editorial: '${editorial}', pages: '${pages}', year: '${year}', genre: '${genre}', language: '${language}', format: '${format}', sinopsis: '${sinopsis}', content: '${content}'})`;
                    await mongo.Write(insert);
                    await mongo.Write('\n');
                }
                
                await mongo.End();
                await mongo.Finish();
                count--;
                if(count === 0) {
                    resolve(true);
                }
            })();
        }
    });
}

module.exports = {
    mysql_insertAutor: mysql_insertAutor,
    mysql_insertLibro: mysql_insertLibro,
    mongo_insertLibro: mongo_insertLibro,
};