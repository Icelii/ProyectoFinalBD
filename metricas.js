const Process = require('./utils/Process');
const FileStream = require('fs');
const sleep = require('./utils/sleep');
const generadorCsv = require("./utils/generador_csv")
const insertData = require("./utils/insertar_datos") 
const loadCsv = require("./utils/insertar_csv");

const metricas = {
    mysql: {
        librosInsert: null,
        autorCsv: null,
        bookCsvCreation: null,
        bookCsvsCreation: null,
        booksCsvsImport: null,
        booksCsvImport: null,
        query: null,
        exportTablesCsv: null,
        ExportImport: null,
        dump: null,
        importDump: null,
        errorAutor: null,
        errorLibro: null,
        lastImportExport: null,
    },
};

(async () => {
    //Tiempo que toma generar 150,000 Autores e insertarlos
    const startAutorCsv = Date.now();
    await generadorCsv.generate_Autorfiles(1, 150000);
    await loadCsv.loadCsvFiles(1, "Autores", "Autor");
    console.log(`[Generar 1 csv 150,000 Autores e insertarlos] Tiempo total: ${Date.now() - startAutorCsv} ms`);
    metricas.mysql.autorCsv = Date.now() - startAutorCsv;
    
    //Tiempo que toma crear 100,000 Libros en la Base de Datos usando datos aleatorios en CSV
    const startBookCsv = Date.now();
    await generadorCsv.generate_Bookfiles(1, 100000, "Librospt");
    console.log(`[Generar 1 csv con 100,000 Libros] Tiempo total: ${Date.now() - startBookCsv} ms`);
    metricas.mysql.bookCsvCreation = Date.now() - startBookCsv;

    //Tiempo que toma insertar el CSV
    const insertCsvBook = Date.now();
    await loadCsv.loadCsvFiles(1, "Librospt", "Libro");
    console.log(`[Insertar 1 csv Libros] Tiempo total: ${Date.now() - insertCsvBook} ms`);
    metricas.mysql.booksCsvImport = Date.now() - insertCsvBook;

    //INSERT MASIVO LIBROS
    const startLibro = Date.now();
    await insertData.mysql_insertLibro(5, 700);
    console.log(`[Insertar 3,500 Libros] Tiempo total: ${Date.now() - startLibro} ms`);
    metricas.mysql.librosInsert = Date.now() - startLibro;

    //Tiempo que toma generar 100 archivos CSV, donde cada archivo incluye 1000 Libros
    const startBooksCsvs = Date.now();
    await generadorCsv.generate_Bookfiles(100, 1000, "Libros");
    console.log(`[Generar 100 csv con 1000 Libros c/u] Tiempo total: ${Date.now() - startBooksCsvs} ms`);
    metricas.mysql.bookCsvsCreation = Date.now() - startBooksCsvs;
    
    //Tiempo que toma insertar los 100 archivos a MySQL
    const startInsertCsvLibros = Date.now();
    await loadCsv.loadCsvFiles(100, "Libros", "Libro");
    console.log(`[Insertar 100 csv archivos a mysql Tiempo total: ${Date.now() - startInsertCsvLibros} ms`);
    metricas.mysql.booksCsvsImport = Date.now() - startInsertCsvLibros;
    
    //Tiempo que toma obtener en 1 solo query
    const queryMysql = new Process("mysql"); 
    queryMysql.ProcessArguments.push("-uroot");
    queryMysql.ProcessArguments.push("--password=22194");
    queryMysql.Execute();
    queryMysql.Write("USE ProyectoBD;");
    queryMysql.Write(`SELECT MAX(pages) AS mayor_paginas, MIN(pages) AS menor_paginas, AVG(pages) AS promedio_paginas, MAX(\`year\`) AS anio_mas_cercano, MIN(\`year\`) AS anio_mas_antiguo, COUNT(*) AS total_libros FROM Libro;`); 
    queryMysql.End();
    await queryMysql.Finish();
    console.log(`[queryMysql] Tiempo total: ${queryMysql.EndTime - queryMysql.StartTime} ms`);
    metricas.mysql.query = queryMysql.EndTime - queryMysql.StartTime;

    //Tiempo que toma exportar ambas tablas Autor y Libro a CSV
    const exportTablesCsv = new Process("mysql");
    exportTablesCsv.ProcessArguments.push("-uroot");
    exportTablesCsv.ProcessArguments.push("--password=22194");
    exportTablesCsv.Execute();
    exportTablesCsv.Write("USE ProyectoBD;");
    exportTablesCsv.Write("SELECT * INTO OUTFILE 'C://ProgramData//MySQL//MySQL Server 9.1//Uploads//autorTable.csv' FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' FROM Autor;");
    exportTablesCsv.Write("SELECT * INTO OUTFILE 'C://ProgramData//MySQL//MySQL Server 9.1//Uploads//libroTable.csv' FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n' FROM Libro;");
    exportTablesCsv.End();
    await exportTablesCsv.Finish();
    console.log(`[Exportar tablas a csv] Tiempo total: ${exportTablesCsv.EndTime - exportTablesCsv.StartTime} ms`);
    metricas.mysql.exportTablesCsv = exportTablesCsv.EndTime - exportTablesCsv.StartTime;

    //Tiempo que toma respaldar ambas tablas a MongoDB, eliminarlas de MySQL, exportar el respaldo de MongoDB y restaurarlo en MySQL.
    const startExportImport = Date.now();
    const mongoImport = new Process("mongoimport");
    mongoImport.ProcessArguments.push("--db", "ProyectoBD");
    mongoImport.ProcessArguments.push("--collection", "Autor");
    mongoImport.ProcessArguments.push("--type", "csv");
    mongoImport.ProcessArguments.push("--file","C://ProgramData//MySQL//MySQL Server 9.1//Uploads//autorTable.csv");
    mongoImport.ProcessArguments.push("--fields", "id,license,name,lastName,secondLastName,year");
    await mongoImport.ExecuteAsync(true);
    mongoImport.ProcessArguments.push("--db", "ProyectoBD");
    mongoImport.ProcessArguments.push("--collection", "Libro");
    mongoImport.ProcessArguments.push("--type", "csv");
    mongoImport.ProcessArguments.push("--file","C://ProgramData//MySQL//MySQL Server 9.1//Uploads//libroTable.csv");
    mongoImport.ProcessArguments.push("--fields", "id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content");
    await mongoImport.ExecuteAsync(true);

    const truncateTables = new Process("mysql");
    truncateTables.ProcessArguments.push("-uroot");
    truncateTables.ProcessArguments.push("--password=22194");
    truncateTables.Execute();
    truncateTables.Write("USE ProyectoBD;");
    truncateTables.Write("SET FOREIGN_KEY_CHECKS = 0;");
    truncateTables.Write("TRUNCATE TABLE Libro;");
    truncateTables.Write("TRUNCATE TABLE Autor;");
    truncateTables.Write("SET FOREIGN_KEY_CHECKS = 1;");
    truncateTables.End();
    await truncateTables.Finish();

    const mongoExport = new Process("mongoexport");
    mongoExport.ProcessArguments.push("--db", "ProyectoBD");
    mongoExport.ProcessArguments.push("--collection", "Autor");
    mongoExport.ProcessArguments.push("--type", "csv");
    mongoExport.ProcessArguments.push("--fields", "id,license,name,lastName,secondLastName,year");
    mongoExport.ProcessArguments.push("--out","C://ProgramData//MySQL//MySQL Server 9.1//Uploads//autorMongoBackup1.csv");
    mongoExport.ProcessArguments.push("--noHeaderLine");
    await mongoExport.ExecuteAsync(true);
    mongoExport.ProcessArguments.push("--db", "ProyectoBD");
    mongoExport.ProcessArguments.push("--collection", "Libro");
    mongoExport.ProcessArguments.push("--type", "csv");
    mongoExport.ProcessArguments.push("--fields", "id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content");
    mongoExport.ProcessArguments.push("--out","C://ProgramData//MySQL//MySQL Server 9.1//Uploads//mongoLibrosBackup1.csv");
    mongoExport.ProcessArguments.push("--noHeaderLine");
    await mongoExport.ExecuteAsync(true);

    await loadCsv.loadCsvFiles(1, "autorMongoBackup", "Autor");
    await loadCsv.loadCsvFiles(1, "mongoLibrosBackup", "Libro");
    console.log(`[Importar y Exportar Mongo/Mysql] Tiempo total: ${Date.now() - startExportImport} ms`);
    metricas.mysql.ExportImport = Date.now() - startExportImport;

    //Tiempo que toma hacer el dump de toda la base de datos de MySQL
    const mysqldump = new Process("mysqldump");
    mysqldump.ProcessArguments.push("-uroot");
    mysqldump.ProcessArguments.push("--password=22194");
    mysqldump.ProcessArguments.push("ProyectoBD");
    mysqldump.ProcessArguments.push("--result-file=ProyectoBD.sql");
    await mysqldump.ExecuteAsync(true);
    console.log(`[mysqldump] Tiempo total: ${mysqldump.EndTime - mysqldump.StartTime} ms`);
    metricas.mysql.dump = mysqldump.EndTime - mysqldump.StartTime;

    //Tiempo que toma importar de nuevo todo el "snapshot" de la base de datos
    const dropMysql = new Process("mysql"); 
    dropMysql.ProcessArguments.push("-uroot");
    dropMysql.ProcessArguments.push("--password=22194");
    dropMysql.Execute();
    dropMysql.Write("DROP DATABASE ProyectoBD;");
    dropMysql.Write("CREATE DATABASE ProyectoBD;");
    dropMysql.End();
    await dropMysql.Finish();
    const importDump = new Process("mysql", {
        shell: true
    });
    importDump.ProcessArguments.push("-uroot");
    importDump.ProcessArguments.push("--password=22194");
    importDump.ProcessArguments.push(" ProyectoBD < ProyectoBD.sql");
    await importDump.ExecuteAsync(true);
    console.log(`[mysqlImportDump] Tiempo total: ${importDump.EndTime - importDump.StartTime} ms`);
    metricas.mysql.importDump = importDump.EndTime - importDump.StartTime;

    //Tiempo que toma fallar cuando intenta insertar un Autor
    const errorInsertAutor = new Process("mysql");
    errorInsertAutor.ProcessArguments.push("-uA");
    errorInsertAutor.ProcessArguments.push("--password=22194");
    errorInsertAutor.Execute();
    errorInsertAutor.Write("USE ProyectoBD;");
    errorInsertAutor.Write("INSERT INTO Autor VALUES(9485, 'COLLINS01762', 'Suzanne', 'Collins', NULL, 1962);");
    errorInsertAutor.End();
    await errorInsertAutor.Finish();
    console.log(`[Intento de insertar un autor] Tiempo total: ${errorInsertAutor.EndTime - errorInsertAutor.StartTime} ms`);
    metricas.mysql.errorAutor = errorInsertAutor.EndTime - errorInsertAutor.StartTime;

    //Tiempo que toma fallar cuando intenta insertar un Libro
    const errorInsertLibro = new Process("mysql");
    errorInsertLibro.ProcessArguments.push("-uB");
    errorInsertLibro.ProcessArguments.push("--password=22194");
    errorInsertLibro.Execute();
    errorInsertLibro.Write("USE ProyectoBD;");
    errorInsertLibro.Write("INSERT INTO Libro VALUES (1, '9780545629500564', 'Los Juegos del Hambre: Balada de Pájaros Cantores y Serpientes','COLLINS01762', 'Scholastic', 528, 2020, 'Distopía', 'Español', 'Físico y Digital', '...');");    
    errorInsertLibro.End();
    await errorInsertLibro.Finish();
    console.log(`[Intento de insertar un Libro] Tiempo total: ${errorInsertLibro.EndTime - errorInsertLibro.StartTime} ms`);
    metricas.mysql.errorLibro = errorInsertLibro.EndTime - errorInsertLibro.StartTime;

    //Generar 1,000,000 de datos en MongoDB para libros
    const csvMongo = Date.now();
    await generadorCsv.generate_Bookfiles(2, 500000, "MongoLibros");
    const bookFields = "id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content";
    await loadCsv.loadCsvFilesMongo(2, "MongoLibros", bookFields);
   
    const mongoExportLibros = new Process("mongoexport");
    mongoExportLibros.ProcessArguments.push("--db", "ProyectoBD");
    mongoExportLibros.ProcessArguments.push("--collection", "Libro");
    mongoExportLibros.ProcessArguments.push("--type", "csv");
    mongoExportLibros.ProcessArguments.push("--fields", "ISBN,pages,year");
    mongoExportLibros.ProcessArguments.push("--out","C://ProgramData//MySQL//MySQL Server 9.1//Uploads//oldBooks1.csv");
    mongoExportLibros.ProcessArguments.push("--noHeaderLine");
    await mongoExportLibros.ExecuteAsync(true);

    const importCsvMongo = new Process("mysql");
    importCsvMongo.ProcessArguments.push("-uroot");
    importCsvMongo.ProcessArguments.push("--password=22194");
    importCsvMongo.Execute();
    importCsvMongo.Write("USE ProyectoBD;");
    importCsvMongo.Write("CREATE TABLE old_books(ISBN VARCHAR(16) NOT NULL, pages SMALLINT, year SMALLINT NOT NULL);");
    importCsvMongo.End();
    await importCsvMongo.Finish();

    await loadCsv.loadCsvFiles(1, "oldBooks", "old_books");
    console.log(`[Crear 1,000,000 en mongo, exportar campos a csv, crear tabla old_books en mysql e insertar csv] Tiempo total: ${Date.now() - csvMongo} ms`);
    metricas.mysql.lastImportExport = Date.now() - csvMongo;

    console.log(metricas);
    generarReporte(metricas);
})();

function generarReporte(metricas) {
    const graficoData1 = {
        type: "bar",
        labels: [
            'Tiempo para crear CSV con 100,000 libros',
            'Tiempo para insertar el CSV con 100,000 libros',
            'Tiempo para insertar masivamente 3500 libros',
        ],
        data: [
            metricas.mysql.bookCsvCreation,
            metricas.mysql.booksCsvImport,
            metricas.mysql.librosInsert,
        ],
        title: "Pruebas de rendimiento de MySQL y MongoDB",
    };

    const graficoData2 = {
        type: "bar",
        labels: [
            'Tiempo para generar 100 archivos CSV con 1000 Libros',
            'Tiempo para insertar los 100 archivos a MySQL',
            'Tiempo que toma obtener en 1 solo query...'
        ],
        data: [
            metricas.mysql.bookCsvsCreation,
            metricas.mysql.booksCsvsImport,
            metricas.mysql.query,
        ],
        title: "Pruebas de rendimiento de MySQL y MongoDB",
    };

    const graficoData3 = {
        type: "bar",
        labels: [
            'Tiempo que toma generar 150,000 Autores e insertarlos',
            'Tiempo que toma exportar ambas tablas a CSV',
            'Tiempo toma respaldar ambas tablas a MongoDB, exportar e importar a mysql',
        ],
        data: [
            metricas.mysql.autorCsv,
            metricas.mysql.exportTablesCsv,
            metricas.mysql.ExportImport,
        ],
        title: "Pruebas de rendimiento de MySQL y MongoDB",
    };

    const graficoData4 = {
        type: "bar",
        labels: [
            'Tiempo que toma hacer el dump de toda la bd de MySQL',
            'Tiempo que toma importar de nuevo todo el "snapshot" de la base de datos',
            'Tiempo que toma fallar cuando intenta insertar un Autor',
        ],
        data: [
            metricas.mysql.dump,
            metricas.mysql.importDump,
            metricas.mysql.errorAutor,
        ],
        title: "Pruebas de rendimiento de MySQL y MongoDB",
    };

    const graficoData5 = {
        type: "bar",
        labels: [
            'Tiempo que toma fallar cuando intenta insertar un Libro',
            'Tiempo que toma generar 1,000,000 de datos insertar en mongo, exportar campos csv, crear en mysql tabla old_books e insertar csv '
        ],
        data: [
            metricas.mysql.errorLibro,
            metricas.mysql.lastImportExport,
        ],
        title: "Pruebas de rendimiento de MySQL y MongoDB",
    };

    const reporte = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <title>Métricas de BD</title>
    </head>
    <body class="bg-light">
        <div class="container my-5">
            <div class="row">
                <div class="col-md-12">
                    <div class="card shadow-sm">
                        <div class="card-header bg-info text-white">
                            <h5 class="card-title">Pruebas de rendimiento de MySQL y MongoDB</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="grafico-bar1"></canvas>
                        </div>
                        <br>
                        <div class="card-body">
                            <canvas id="grafico-bar2"></canvas>
                        </div>
                        <div class="card-body">
                            <canvas id="grafico-bar3"></canvas>
                        </div>
                        <div class="card-body">
                            <canvas id="grafico-bar4"></canvas>
                        </div>
                        <div class="card-body">
                            <canvas id="grafico-bar5"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            const graficoReporte1 = document.getElementById('grafico-bar1').getContext('2d');
            const graficoReporte2 = document.getElementById('grafico-bar2').getContext('2d');
            const graficoReporte3 = document.getElementById('grafico-bar3').getContext('2d');
            const graficoReporte4 = document.getElementById('grafico-bar4').getContext('2d');
            const graficoReporte5 = document.getElementById('grafico-bar5').getContext('2d');

            const options = {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tiempo (ms)',
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            };

            new Chart(graficoReporte1, {
                type: '${graficoData1.type}',
                data: {
                    labels: ${JSON.stringify(graficoData1.labels)},
                    datasets: [{
                        label: '${graficoData1.title}',
                        data: ${JSON.stringify(graficoData1.data)},
                        borderWidth: 1,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                        ],
                    }]
                },
                options: options
            });

            new Chart(graficoReporte2, {
                type: '${graficoData2.type}',
                data: {
                    labels: ${JSON.stringify(graficoData2.labels)},
                    datasets: [{
                        label: '${graficoData2.title}',
                        data: ${JSON.stringify(graficoData2.data)},
                        borderWidth: 1,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)', 
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)', 
                        ],
                    }]
                },
                options: options
            });

            new Chart(graficoReporte3, {
                type: '${graficoData3.type}',
                data: {
                    labels: ${JSON.stringify(graficoData3.labels)},
                    datasets: [{
                        label: '${graficoData3.title}',
                        data: ${JSON.stringify(graficoData3.data)},
                        borderWidth: 1,
                        backgroundColor: [
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)',
                            'rgba(255, 0, 255, 0.7)',   
                        ],
                        borderColor: [
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)',
                            'rgba(255, 0, 255, 0.7)', 
                        ],
                    }]
                },
                options: options
            });

            new Chart(graficoReporte4, {
                type: '${graficoData4.type}',
                data: {
                    labels: ${JSON.stringify(graficoData4.labels)},
                    datasets: [{
                        label: '${graficoData4.title}',
                        data: ${JSON.stringify(graficoData4.data)},
                        borderWidth: 1,
                        backgroundColor: [
                            'rgba(30, 144, 255, 0.7)',
                            'rgba(135, 206, 235, 0.7)',
                            'rgba(72, 209, 204, 0.7)',
                        ],
                        borderColor: [
                            'rgba(30, 144, 255, 0.7)',
                            'rgba(135, 206, 235, 0.7)',
                            'rgba(72, 209, 204, 0.7)',
                        ],
                    }]
                },
                options: options
            });

            new Chart(graficoReporte5, {
                type: '${graficoData5.type}',
                data: {
                    labels: ${JSON.stringify(graficoData5.labels)},
                    datasets: [{
                        label: '${graficoData5.title}',
                        data: ${JSON.stringify(graficoData5.data)},
                        borderWidth: 1,
                        backgroundColor: [
                            'rgba(255, 182, 193, 0.7)',
                            'rgba(176, 224, 230, 0.7)',
                            'rgba(255, 239, 213, 0.7)',
                        ],
                        borderColor: [
                            'rgba(255, 182, 193, 0.7)',
                            'rgba(176, 224, 230, 0.7)',
                            'rgba(255, 239, 213, 0.7)',
                        ],
                    }]
                },
                options: options
            });

        </script>
    </body>
    </html>`;

    const FileStream = require('fs');
    FileStream.writeFileSync("Reporte.html", reporte);
}
