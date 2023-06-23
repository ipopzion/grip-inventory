loadForm();

function loadForm() {
    const qfield = document.querySelector("#qfield");
    fetch("questions.json")
    .then(res => res.json())
    .then(data => {
        const rcontent = document.createElement("div");
        rcontent.classList.add("content");
        const chart = document.createElement("canvas");
        chart.setAttribute("id", "myChart");
        chart.setAttribute("style", "width:100%;max-width:700px");
        rcontent.appendChild(chart);

        Array.from(data).forEach(category => {
            const [qcat, rcat] = loadCategory(category);
            rcontent.appendChild(rcat);
            qfield.appendChild(qcat);
            rcontent.appendChild(rcat);
        });

        const results = document.createElement("button");
        results.classList.add("collapsible");
        results.classList.add("rbutton");
        results.setAttribute("type", "button");
        results.addEventListener('click', tabulate);
        results.innerText = "Results";

        const rfield = document.createElement("div");
        rfield.classList.add("category");
        rfield.appendChild(results);
        rfield.appendChild(rcontent);
        qfield.appendChild(rfield);
        loadCollapsible();
        tabulate();
    });
}

function loadCategory(category) {
    const qcat = document.createElement("div");
    const rcat = document.createElement("div");
    qcat.classList.add("category");
    
    const collapsible = document.createElement("button");
    collapsible.classList.add("collapsible");
    collapsible.classList.add(`cat${category.category}`);
    collapsible.setAttribute("type", "button");
    collapsible.innerText = category.title;
    qcat.appendChild(collapsible);

    const content = document.createElement("div");
    content.classList.add("content");
    let questionCount = 1;
    const questions = category.questions;
    questions.forEach(q => {
        const question = document.createElement("div");
        question.classList.add("question");

        const question_text = document.createElement("p");
        question_text.innerText = q.q;
        question.appendChild(question_text);

        const scoreboard = document.createElement("div");
        scoreboard.classList.add("scoreboard");
        for (let i=1; i<6; i++) {
            const score = document.createElement("div");
            score.classList.add("score")
            score.setAttribute("category", `${category.category}`)

            const bubble = document.createElement("input");
            bubble.setAttribute("type", "radio");
            bubble.setAttribute("name", `${category.category}q${questionCount}`);
            score.appendChild(bubble);

            const num = document.createElement("p");
            num.innerText = `${i}`;
            score.appendChild(num);

            scoreboard.appendChild(score);
        }
        question.appendChild(scoreboard);
        content.appendChild(question);
        qcat.appendChild(content);     
        questionCount++;   
    })

    const title = document.createElement("h4");
    title.innerHTML = category.title;
    rcat.appendChild(title);
    rcat.classList.add("results")
    return [qcat, rcat];
}

function loadCollapsible() {
    const coll = document.querySelectorAll(".collapsible");
    for (let i=0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            Array.from(coll)
            .filter(col => col != coll[i])
            .filter(col => col.classList.contains("active"))
            .forEach(col => col.click());

            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

function tabulate() {
    const results 
    = Array.from(document.querySelectorAll(".score"))
    .filter(score => score.children[0].checked)
    .reduce(function(scoresheet, score) {
        const category = score.getAttribute("category");
        scoresheet[category-1] += parseInt(score.innerText);
        return scoresheet;
    }, [0, 0, 0, 0, 0, 0, 0, 0]);
    loadResults(results);
}

function loadResults(results) {
    let catCount = 1;
    const chartLabels = [];
    let headers = 
    Array.from(document.querySelectorAll(".results"));
    fetch("results.json")
    .then(res => res.json())
    .then(data => {
        Array.from(data).forEach(category => {
            chartLabels.push(category["title"]);
            const header = headers[catCount-1];
            const score = results[catCount];
            let point = header.querySelector("p");
            if (point == null) {
                point = document.createElement("p");
                header.appendChild(point);
            } 
            if (score == null || score <= 20) {
                point.innerText = category["results"]["L"];
                if (category["results"]["A"]) {
                    point.innerText += "\n\n" + (category["results"]["A"])
                }
            } else if (score >= 28) {
                point.innerText = category["results"]["H"];
            } else {
                point.innerText = category["results"]["M"];
            }
            catCount++;
        });
        // new Chart("myChart", {
        //     type: "radar",
        //     data: {
        //         labels: chartLabels,
        //         datasets: [{
        //         backgroundColor: "rgba(132,99,255,0.2)",
        //         borderColor: "rgba(132,99,255,1)",
        //         pointBorderColor: "#fff",
        //         pointBackgroundColor: "rgba(132,99,255,1)",
        //         data: results,
        //         }]
        //     },
        //     options: {
        //         legend: {display: false}
        //     }
        // });
        let chartData = [8];
        for (let i=0; i<8; i++) {
            chartData[i] = {x: chartLabels[i], value: results[i]};
        }

        var data1 = [
            {x: "HP", value: 39},
            {x: "Attack", value: 52},
            {x: "Defense", value: 43},
            {x: "Special Attack", value: 60},
            {x: "Special Defense", value: 50},
            {x: "Speed", value: 65},
          ];
        
        anychart.onDocumentReady(function () {
            let chart = anychart.radar();
            chart.yScale().minimum(0).maximum(28).ticks({'interval':7});
            chart.title("Results");
            chart.line(data1);
            chart.container('myChart');
            chart.draw();
        })
    });
}