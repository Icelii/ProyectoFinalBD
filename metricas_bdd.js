const Process = require('./utils/Process');
const sleep = require('./utils/sleep');

const metricas = {
    mysql: {
        export: null,
        drop: null,
        import: null
    },
    mongo: {
        export: null,
        drop: null,
        import: null
    }
};

(async () => {
    //TODO: Crear las metricas
    
    //Imprimir métricas
    console.log(metricas);
    generarReporte(metricas);
})();

function generarReporte(metricas) {

    const grafico_mysql = {
        type: "bar",
        labels: `['Export', 'Drop', 'Import']`,
        data: `[${metricas.mysql.export}, ${metricas.mysql.drop}, ${metricas.mysql.import}]`,
        title: "Pruebas de rendimiento de MySQL"
    }

    const grafico_mongo = {
        type: "bar",
        labels: `['Export', 'Drop', 'Import']`,
        data: `[${metricas.mongo.export}, ${metricas.mongo.drop}, ${metricas.mongo.import}]`,
        title: "Pruebas de rendimiento de Mongo"
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
            <hr>
            <canvas id="grafico-mongo"></canvas>

        </div>

        <script>
            const mysql = document.getElementById('grafico-mysql');
            const mongo = document.getElementById('grafico-mongo');

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

            new Chart(mongo, {
                type: '${grafico_mongo.type}',
                data: {
                labels: ${grafico_mongo.labels},
                datasets: [{
                    label: '${grafico_mongo.title}',
                    data: ${grafico_mongo.data},
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
    FileStream.writeFileSync("reporte.html", reporte);
}