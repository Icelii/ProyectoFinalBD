const Process = require('./utils/Process');
const sleep = require('./utils/sleep');
const generadorCsv = require("./utils/generador_datos")
const insertData = require("./insertar_datos_sql") 

const metricas = {
    mysql: {
        autorInsertExecutionTime: null,
        libroInsertExecutionTime: null,
        autorCsvCreationTime: null,
    },
};

(async () => {
    //INSERT MASIVO AUTORES
    const startAutor = Date.now();
    await insertData.mysql_insertAutor(1, 300);
    metricas.mysql.autorInsertExecutionTime = Date.now() - startAutor;

    //INSERT MASIVO LIBROS
    const startLibro = Date.now();
    await insertData.mysql_insertLibro(2, 30);
    metricas.mysql.libroInsertExecutionTime = Date.now() - startLibro;

    //TODO: REDUCIR ESTA PARTE DEL CÓDIGO
    //GENERAR CSV AUTOR
    const fileAutorNum = 5;
    const startAutorCsv = Date.now();
    for(let i= 1; i <= fileAutorNum; i++){
        const authorFilePath = `./exports/Authors csv/Autores_${i}.csv`;    
        generadorCsv.generate_AuthorsCsv(10, authorFilePath);
        metricas.mysql.autorCsvCreationTime = Date.now() - startAutorCsv;
    }
        
    console.log(metricas);
    generarReporte(metricas);
})();

function generarReporte(metricas) {

    const grafico_mysql = {
        type: "bar",
        labels: `['Insert authors', 'Insert books', 'Autor csv']`,
        data: `[${metricas.mysql.autorInsertExecutionTime}, ${metricas.mysql.libroInsertExecutionTime}, ${metricas.mysql.autorCsvCreationTime}]`,
        title: "Pruebas de rendimiento de MySQL"
    }

    const reporte = 
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <title>Métricas de BDD</title>
    </head>
    <body>
        <div>
            <canvas id="grafico-mysql"></canvas>
        </div>

        <script>
            const mysql = document.getElementById('grafico-mysql');

            new Chart(mysql, {
                type: '${grafico_mysql.type}',
                data: {
                labels: ${grafico_mysql.labels},
                datasets: [{
                    label: '${grafico_mysql.title}',
                    data: ${grafico_mysql.data},
                    borderWidth: 1
                }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        </script>
    </body>
    </html>
    `;

    const FileStream = require('fs');
    FileStream.writeFileSync("./exports/Reportes/reporte_Mysql.html", reporte);
}