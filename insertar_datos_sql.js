const Process = require("./utils/Process");
const generador = require("./utils/generador_datos")

const random_number = generador.random_number;
const random_text = generador.random_text;

let metricas = {
    mysql: {
        autorInsertExecutionTime: null,
        libroInsertExecutionTime: null,
    }
};

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
    const startTime = Date.now();

    return new Promise(async (resolve, reject) => {
        for (let p = 0; p < threads; p++) {
            const mysql = new Process("mysql", {
                shell: true
            });
            mysql.ProcessArguments.push("-uIceli");
            mysql.ProcessArguments.push("--password=22194");
            mysql.Execute();
            mysql.Write("use ProyectoBD;");
            mysql.Write('\n');

            for (let i = 0; i < repeticiones; i++) {
                const id = random_number(1, 2000);
                const license = random_text(12, true);
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
                const endTime = Date.now();
                metricas.mysql.autorInsertExecutionTime = endTime - startTime;
                resolve(true);
            }
        }
    });
}

async function mysql_insertLibro(threads, repeticiones) {
    let count = threads;
    const startTime = Date.now();
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
                const pages = random_number(0, 1000);
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
                const endTime = Date.now();
                metricas.mysql.libroInsertExecutionTime = endTime - startTime;
                resolve(true);
            }
        }
    });
}

//PARA PRUEBAS.
/*(async () => {
    for(let i = 0; i < 1000; i++) {
        let inicio = Date.now();
        await mysql_insertAutor(1, 300);
        await mysql_insertLibro(2, 30)
        let fin = Date.now();
        console.log(`Tiempo total: ${(fin - inicio) / 1000} segundos`);
    }
})(); */

module.exports = {
    getLicenses: getLicenses,
    mysql_insertAutor: mysql_insertAutor,
    mysql_insertLibro: mysql_insertLibro,
    metricas: metricas,
};