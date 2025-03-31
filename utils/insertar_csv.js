const Process = require('./Process');

async function loadCsvMysql(archivo, table) {
    const csvInsert = new Process("mysql");
    csvInsert.process_arguments.push("--local-infile=1");
    csvInsert.ProcessArguments.push(`-uroot`);
    csvInsert.ProcessArguments.push(`--password=22194`);
    csvInsert.Execute();
    csvInsert.Write("use ProyectoBD;");
    csvInsert.Write('\n');
    csvInsert.Write(`LOAD DATA LOCAL INFILE 'C:/ProgramData/MySQL/MySQL Server 9.1/Uploads/${archivo}' INTO TABLE ${table} FIELDS TERMINATED BY ',' LINES TERMINATED BY '\r\n';`);
    csvInsert.Write('\n');
    csvInsert.End();
    await csvInsert.Finish();
}

async function loadCSVMongo(archivo, collection, fields) {
    const mongoImportLibros = new Process("mongoimport");
    mongoImportLibros.ProcessArguments.push("--db", "ProyectoBD");
    mongoImportLibros.ProcessArguments.push("--collection", collection);
    mongoImportLibros.ProcessArguments.push("--type", "csv");
    mongoImportLibros.ProcessArguments.push("--file", `C://ProgramData//MySQL//MySQL Server 9.1//Uploads//${archivo}`);
    mongoImportLibros.ProcessArguments.push("--fields", fields);
    await mongoImportLibros.ExecuteAsync(true);
}

async function loadCsvFiles(filesToLoad, prefix, table) {
    try {
        const archivos = [];
        for (let i = 1; i <= filesToLoad; i++) {
            archivos.push(`${prefix}${i}.csv`);
        }

        await Promise.all(archivos.map(archivo => loadCsvMysql(archivo, table)));
    } catch (error) {
        console.error('Hubo un error al cargar los archivos:', error);
    }
}

async function loadCsvFilesMongo(filesToLoad, prefix, collection, fields) {
    try {
        const archivos = [];
        for (let i = 1; i <= filesToLoad; i++) {
            archivos.push(`${prefix}${i}.csv`);
        }

        await Promise.all(archivos.map(archivo => loadCSVMongo(archivo, collection, fields)));
    } catch (error) {
        console.error('Hubo un error al cargar los archivos:', error);
    }
}

module.exports = {
    loadCsvFiles: loadCsvFiles,
    loadCsvFilesMongo: loadCsvFilesMongo
};