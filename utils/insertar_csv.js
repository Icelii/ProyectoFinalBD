const Process = require('./Process');

async function loadCsvMysql(archivo, table, user, password) {
    const insertCsvAutor = new Process("mysql");
    insertCsvAutor.ProcessArguments.push(`-u${user}`);
    insertCsvAutor.ProcessArguments.push(`--password=${password}`);
    insertCsvAutor.Execute();
    insertCsvAutor.Write(`LOAD DATA INFILE 'C://ProgramData//MySQL//MySQL Server 9.1//Uploads//${archivo}' INTO TABLE ProyectoBD.${table} FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n';`);
    insertCsvAutor.End();
    await insertCsvAutor.Finish();
}

async function loadCsvFiles(filesToLoad, prefix, table, user, password) {
    try {
        const archivos = [];
        for (let i = 1; i <= filesToLoad; i++) {
            archivos.push(`${prefix}${i}.csv`);
        }

        await Promise.all(archivos.map(archivo => loadCsvMysql(archivo, table, user, password)));
    } catch (error) {
        console.error('Hubo un error al cargar los archivos:', error);
    }
}

module.exports = {
    loadCsvFiles: loadCsvFiles
};