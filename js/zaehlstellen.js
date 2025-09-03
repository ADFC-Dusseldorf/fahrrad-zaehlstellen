
        document.addEventListener('DOMContentLoaded', function () {
            setHeight();
        });

        window.addEventListener('resize', function () {
            setHeight();
            // Your code for when the window is resized
        });

        function setHeight() {
            const top = document.getElementById('form');
            const h2 = document.querySelectorAll('h2'); // Select all h2 elements with class 'sticky'


            // Get the height of the first sticky element
            const topHeight = top.offsetHeight;


            h2.forEach((stickyElement, index) => {
                // Set the top based on the height of the previous sticky elements
                const topValue = topHeight + (stickyElement.offsetHeight) - (stickyElement.offsetHeight);
                stickyElement.style.top = `${topValue}px`;
            });
        }

        document.getElementById('load').addEventListener('click', function (event) {
            event.preventDefault();
            load();

        });


        document.getElementById('ende').valueAsDate = new Date();
        document.getElementById('start').valueAsDate = new Date(new Date().setDate(new Date().getDate() - 14));

        

        // Get the <select> element by its id
        const selectElement = document.getElementById("name");

        // Iterate over the stationen array and create <option> elements for each station
        stationen.forEach(station => {
            const option = document.createElement("option");
            option.value = station.id;  // Use id as the value of the option
            option.textContent = station.name;  // Use name as the displayed text

            // Append the option to the select element
            selectElement.appendChild(option);
        });
        function findTokenById(id) {
            const station = stationen.find(station => station.id === id);
            return station ? station.t : null;  // If found, return token; otherwise, return null
        }
        function findNameById(id) {
            const station = stationen.find(station => station.id === id);
            return station ? station.name : null;  // If found, return token; otherwise, return null
        }
        /**
* Fetches a JSON file from a URL and returns the content as a JavaScript array.
* @param {string} url - The URL to fetch the JSON from.
* @returns {Promise<Array>} - A promise that resolves to a JavaScript array.
*/
        async function fetchJsonAsArray(url) {
            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Fetched JSON is not an array.");
                }
                const parsedArray = data.map(item => ({
                    ...item,
                    date: new Date(item.timestamp) // or use new Date(item.timestamp)
                }));
                return parsedArray;
            } catch (error) {
                console.error(`Error fetching or parsing JSON: ${error.message}`);
                throw error;
            }
        }
        function printDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        }

        function load() {
            station = document.getElementById('name').value;
            if (station === "") {
                alert("Bitte Zählstelle auswählen");
                return;
            }
            if (document.getElementById('start').value === "") {
                alert("Bitte Startdatum auswählen");
                return;
            }
            if (document.getElementById('ende').value === "") {
                alert("Bitte Enddatum auswählen");
                return;
            }
            end = new Date(document.getElementById('ende').value);
            start = new Date(document.getElementById('start').value);
            
            document.getElementById('summary').innerHTML += "<br>Warten auf Aktualisierung ...";
            url = 'https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpage/data/' + station + '?begin=' + printDate(start) + '&end=' + printDate(end) + '&step=3&domain=857&withNull=true&t=' + findTokenById(station);

            fetchJsonAsArray(url)
                .then(dataArray => {
                    if(dataArray.length === 0) {
                        alert("Keine Daten gefunden");
                        return;
                    }
                    createChart(dataArray);
                    document.getElementById('summary').innerHTML = "Z&auml;hlstelle: " + findNameById(station) + "; Zeitraum von " + start.toLocaleDateString() + " bis " + end.toLocaleDateString();
                    var chartArea = document.getElementById("chartAreas");
                    if (chartArea.style.display === "" || chartArea.style.display === "none") {
                        chartArea.style.display = "block";
                    }
                })
                .catch(error => {
                    console.error("Failed to fetch JSON array:", error);
                });
        }

        dailyC = null;
        weekdayC = null;
        monthlyC = null;
        hourlyC = null;

        function createChart(data) {
            const daily = document.getElementById('daily');
            const weekday = document.getElementById('weekday');
            const monthly = document.getElementById('monthly');
            const hourly = document.getElementById('hour');

            if (dailyC) {
                dailyC.destroy();
                weekdayC.destroy();
                monthlyC.destroy();
                hourlyC.destroy();
            }

            dailyData = aggregateByDay(data);
            dailyC = new Chart(daily, {
                type: 'bar',
                data: {
                    labels: dailyData.map(row => row.grouping),
                    datasets: [{
                        label: 'Radfahrer gesamt',
                        data: dailyData.map(row => row.comptage),
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

            weekdayData = aggregateByWeekday(data);
            weekdayC = new Chart(weekday, {
                type: 'bar',
                data: {
                    labels: weekdayData.map(row => row.dayOfWeek),
                    datasets: [{
                        label: 'Durchschnitt pro Tag',
                        data: weekdayData.map(row => parseInt(row.comptage)),
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

            monthlyData = aggregateByMonth(data);
            monthlyDataAvg = aggregateByMonthDailyAvg(data);

            monthlyC = new Chart(monthly, {
                type: 'bar',
                data: {
                    labels: monthlyData.map(row => row.grouping),
                    datasets: [{
                        label: 'Radfahrer gesamt',
                        data: monthlyData.map(row => row.comptage),
                        borderWidth: 1
                    },
                    {
                        label: 'Durchschnitt pro Tag',
                        type: 'line',
                        data: monthlyDataAvg.map(row => parseInt(row.comptage)),
                        borderWidth: 1,
                        yAxisID: 'y2'
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Radfahrer gesamt'
                            }
                        }
                        ,
                        y2: { // Secondary Y-axis
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Durchschnitt pro Tag'
                            },
                            position: 'right', // Position the secondary axis on the right
                            beginAtZero: true, // Optional: set the secondary axis to begin at zero
                            grid: {
                                drawOnChartArea: false // Hide grid lines for the secondary axis
                            }
                        }
                    }
                }
            });

            hourlyData = aggregateByHour(data);
            hourlyMoData = aggregateByHourMoFr(data);
            hourlySaData = aggregateByHourSaSo(data);
            hourlyC = new Chart(hourly, {
                type: 'line',
                data: {
                    labels: hourlyData.map(row => row.grouping),
                    datasets: [{
                        label: 'Durchschnitt gesamte Woche (Mo - So)',
                        data: hourlyData.map(row => parseInt(row.comptage)),
                        borderWidth: 1
                    }, {
                        label: 'Durchschnitt Wochentage (Mo - Fr)',
                        data: hourlyMoData.map(row => parseInt(row.comptage)),
                        borderWidth: 1
                    }, {
                        label: 'Durchschnitt Wochenende (Sa - So)',
                        data: hourlySaData.map(row => parseInt(row.comptage)),
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Stunde'
                            }
                        }, y: {
                            beginAtZero: true
                        }
                    }
                }
            });

        }

        function aggregateByWeekday(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                if (!aggregated[dayOfWeek]) {
                    aggregated[dayOfWeek] = { sum: 0, count: 0 };
                }

                aggregated[dayOfWeek].sum += item.comptage;
                aggregated[dayOfWeek].count += 1;
            });

            const resultArray = Object.keys(aggregated).map(day => {
                const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
                const { sum, count } = aggregated[day];
                return {
                    dayOfWeek: dayNames[parseInt(day)],  // Ensure the key is converted back to a number
                    comptage: sum / count * 24
                };
            });
            resultArray.push(resultArray.shift());
            return resultArray;
        }


        function aggregateByMonthDailyAvg(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const grouping = date.getFullYear() + ' - ' + (1 + date.getMonth()); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                if (!aggregated[grouping]) {
                    aggregated[grouping] = { sum: 0, count: 0 };
                }

                aggregated[grouping].sum += item.comptage;
                aggregated[grouping].count += 1;
            });

            const resultArray = Object.keys(aggregated).map(record => {
                const { sum, count } = aggregated[record];
                return {
                    grouping: record,  // Ensure the key is converted back to a number
                    comptage: sum / count * 24

                };
            });

            return resultArray;
        }

        function aggregateByMonth(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const grouping = date.getFullYear() + ' - ' + (1 + date.getMonth()); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                if (!aggregated[grouping]) {
                    aggregated[grouping] = 0;
                }

                aggregated[grouping] += item.comptage;
            });

            const resultArray = Object.keys(aggregated).map(record => {
                return {
                    grouping: record,  // Ensure the key is converted back to a number
                    comptage: aggregated[record]
                };
            });

            return resultArray;
        }

        function aggregateByDay(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const grouping = date.toISOString().split('T')[0]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

                if (!aggregated[grouping]) {
                    aggregated[grouping] = 0;
                }

                aggregated[grouping] += item.comptage;
            });

            const resultArray = Object.keys(aggregated).map(record => {
                return {
                    grouping: record,  // Ensure the key is converted back to a number
                    comptage: aggregated[record]
                };
            });

            return resultArray;

        }

        function aggregateByHour(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const grouping = date.getUTCHours();

                if (!aggregated[grouping]) {
                    aggregated[grouping] = { sum: 0, count: 0 };;
                }

                aggregated[grouping].sum += item.comptage;
                aggregated[grouping].count += 1;
            });

            const resultArray = Object.keys(aggregated).map(record => {
                const { sum, count } = aggregated[record];
                return {
                    grouping: parseInt(record),  // Ensure the key is converted back to a number
                    comptage: sum / count
                };
            });

            return resultArray;

        }

        function aggregateByHourMoFr(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const dayOfWeek = date.getUTCDay();
                const grouping = date.getUTCHours();

                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    if (!aggregated[grouping]) {
                        aggregated[grouping] = { sum: 0, count: 0 };
                    }

                    aggregated[grouping].sum += item.comptage;
                    aggregated[grouping].count += 1;
                }
            });

            const resultArray = Object.keys(aggregated).map(record => {
                const { sum, count } = aggregated[record];
                return {
                    grouping: parseInt(record),  // Ensure the key is converted back to a number
                    comptage: sum / count
                };
            });

            return resultArray;

        }

        function aggregateByHourSaSo(data) {

            const aggregated = {};

            data.forEach(item => {
                const date = new Date(item.date);
                const dayOfWeek = date.getUTCDay();
                const grouping = date.getUTCHours();

                if (dayOfWeek == 0 || dayOfWeek == 6) {
                    if (!aggregated[grouping]) {
                        aggregated[grouping] = { sum: 0, count: 0 };
                    }

                    aggregated[grouping].sum += item.comptage;
                    aggregated[grouping].count += 1;
                }
            });

            const resultArray = Object.keys(aggregated).map(record => {
                const { sum, count } = aggregated[record];
                return {
                    grouping: parseInt(record),  // Ensure the key is converted back to a number
                    comptage: sum / count
                };
            });

            return resultArray;
        }

