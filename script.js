$(document).ready(function () {
    $.ajax({
        type: 'GET',
        url: 'https://api.npoint.io/40a7bb1b0d77612ceac0',
        data: { get_param: 'value' },
        success: function (data) {
            loadContext(data.context);
            loadQuestionaire(data.survey);
            loadPlan(data.plan)
            loadPrinter()
            $("#loadingScreen").hide()
        },
        error: function () {
            fetch("data.json")
                .then(res => res.json())
                .then(data => {
                    loadContext(data.context);
                    loadQuestionaire(data.survey);
                    loadPlan(data.plan)
                    loadPrinter()
                    $("#loadingScreen").hide()
                })
        }
    });
    loadbuttons();
});

function createToolTip(element, message) {
    const tooltip = $(`<div class=tooltip>${message}</div>`).appendTo(element)
    const offset = element.offset()
    offset["top"] += (element.css('height') - tooltip.css('height')) / 2
    offset["left"] += (element.css('width') - tooltip.css('width')) / 2
    tooltip.offset(offset) 
    tooltip.hide()
    return tooltip
}

function loadContext(context) {
    $("<img/>", {
        "id": "tbclogo",
        "alt": "churchlogo", 
        src: "churchlogo.png",
        crossorigin: "anonymous"
    }).appendTo($("<div class=context></div>").appendTo("#introduction"))

    $("<h2>Growth Inventory and Plan</h2>")
    .appendTo($("<div class=context></div>")
    .appendTo("#introduction"))

    context.forEach(section => {
        const key = Object.keys(section)[0]
        const val = Object.values(section)[0]

        const items = [`<h3>${key}</h3>`]
        val.forEach(obj => items.push(
            typeof (obj) == "string"
                ? `<p>${obj}</p>`
                : `<ul>${obj.map(li => `<li>${li}</li>`).join("")}</ul>`
        ))
        $("<div/>", {
            "class": "context",
            html: items.join("")
        }).appendTo("#introduction");
    })
}

function loadPlan(plan) {
    plan.forEach(section => {
        const key = Object.keys(section)[0]
        const val = Object.values(section)[0]

        const items = [`<h3>${key}</h3>`]
        val.forEach(obj => items.push(
            typeof (obj) == "string"
                ? `<p>${obj}</p>`
                : `<ul>${obj.map(li => `<li>${li}</li>`).join("")}</ul>`
        ))
        $("<div/>", {
            "class": "context",
            html: items.join("")
        }).appendTo("#plan");

    })
}

function loadQuestionaire(survey) {
    function compareFunction(a, b) {
        const scoreA = parseInt(a.children(".scoreboard").text())
        const scoreB = parseInt(b.children(".scoreboard").text())
        if (!scoreA) { return 1 }
        if (!scoreB) { return -1 }
        return (scoreA < scoreB) ? 1 : -1
    }

    const rankState = {
        categories: Array(),
        addRow: function (row) { this.categories.push(row) },
        handleOrder: function () {
            this.categories.sort(compareFunction)
            this.categories.forEach((row, index) => {
                row.parent().css("order", index)
            })
        }
    }

    const hintState = {
        cardHint: null,
        rowHint: null,
        clickedCard: false,
        completedCategory: false,
        clickedRow: false,
        handleCompleteCategory: function() {
            if (!this.completedCategory) {
                this.completedCategory = true
                this.rowHint.text("Click on the cards for more information")
                this.rowHint.show()
            }
        },
        init: function() {
            var _self = this

            this.cardHint = createToolTip($("#questionaire"), "Click on a card to start answering")
            this.cardHint.show()
            $(".card").click(function () {
                if (!_self.clickedCard) {
                    _self.clickedCard = true
                    _self.cardHint.hide()
                }
            }) 
            
            this.rowHint = createToolTip($(".row-wrapper").first(), "Answer some questions before coming back")
            $(".row-wrapper").click(function() {
                if (!_self.completedCategory & !_self.clickedRow) {
                    _self.rowHint.show().fadeOut(2500)
                } else if (!_self.clickedRow) {
                    _self.clickedRow = true
                    _self.rowHint.hide()
                    createToolTip(
                        $(this).find('> .score-content > a').first(), 
                        "Click to view tool box")
                        .show().fadeOut(2500)
                }
            })
        }
    }

    survey.forEach(category => {
        // card and row objects 
        const card = $('<div/>', {
            "class": "card-wrapper",
        }).appendTo($('<div/>', {
            "class": "card",
            "style": `background-color:#D1CCC3`,
            click: function () { $(this).addClass("open") }
        }).appendTo("#questionaire"))
        const cardHeader = $(`<h4>${category.title}</h4>`).appendTo(card)

        const row = $('<div/>', {
            "class": "row-wrapper",
        }).appendTo($('<div/>', {
            "class": "row",
            "style": `background-color:#D1CCC3`,
            click: function () {
                if ($(this).css("background-color") != "rgb(209, 204, 195)") {
                    $(this).addClass("open")
                }
            }
        }).appendTo("#evaluation"))
        $(`<h4>${category.title}</h4>`).appendTo(row)
        const scoreBoard = $(`<h4 class=scoreboard></h4>`).appendTo(row)
        rankState.addRow(row)

        $(`<span class="close">X</span>`)
            .click(function (e) {
                e.stopPropagation();
                $(this).parent().parent().removeClass("open");
            })
            .appendTo([card, row])

        const scoreState = {
            score: JSON.parse(localStorage.getItem(`category${category.category}scores`)) ?? Array(),
            totalSize: category.questions.length,
            complete: false,
            updateScore: function (index, newScore) {
                this.score[index] = newScore
                this.performSave()
                const sum = this.score.reduce((a, b) => a + b, 0)
                scoreBoard.text(sum)
                evalState.updateContent(sum)
                rankState.handleOrder()
                if (!this.complete) {
                    if (this.score.length == this.totalSize) {
                        this.complete = true;
                        card.parent().css("background-color", category.backgroundcolor, 400);
                        row.parent().css("background-color", category.backgroundcolor, 400);
                        hintState.handleCompleteCategory()
                    }
                }
            },
            performSave: function() {
                console.log("saved")
                console.log(JSON.stringify(this.score))
                localStorage.setItem(`category${category.category}scores`, JSON.stringify(this.score))
            },
        }
        const evalState = {
            contents: category.scores,
            levels: Object.keys(category.scores).map(x => parseInt(x)),
            currentLevel: 0,
            updateContent: function (newScore) {
                const newLevel = this.levels.reduce((a, b) => newScore > b ? b : a);
                if (newLevel != this.currentLevel) {
                    this.currentLevel = newLevel;
                    scoreDescription.text(category.scores[newLevel])
                }
            }
        }

        // card content 
        const questions = $("<div/>", {
            "class": "questions",
        }).appendTo(card)

        // row content 
        const contentGroup = $('<div/>', {
            "class": "score-content",
        }).appendTo(row)

        const scoreDescription = $('<p/>', {
            "class": "score-description",
            text: category.scores[0],
        }).appendTo(contentGroup)

        $(`<p/>`, {
            text: "Click on the Tool Box for more tips!", 
            class: "hint"
        }).appendTo(contentGroup)

        $('<a/>', {
            "class": "toollink",
            html: `<svg fill="${category.backgroundcolor}" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 449.13 449.129" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M66.748,110.213c0.881-0.43,1.737-0.895,2.566-1.359c0.421,0.555,0.861,1.086,1.379,1.595l48.531,48.542 c3.037-3.562,7.508-5.806,12.354-5.806c1.569,0,3.131,0.225,4.635,0.673l6.051,1.8l3.766-12.67L92.091,89.045 c-0.856-0.846-1.776-1.557-2.769-2.165l0.127-0.558c0.128-0.513,0.294-0.898,0.45-1.341c0.124-0.331,0.255-0.678,0.378-1.042 c0.157-0.353,0.313-0.728,0.47-1.119c0.268-0.651,0.553-1.357,0.919-2.074l1.013-2.057l1.154-2.038 c0.487-0.936,1.037-1.749,1.664-2.679c0.336-0.492,0.673-1.004,1.016-1.523c0.303-0.405,0.621-0.818,0.934-1.246 c0.786-1.037,1.519-2.021,2.315-2.872l0.556-0.613c1.053-1.149,2.106-2.337,3.332-3.349c0.39-0.348,0.684-0.618,0.994-0.892 c0.414-0.386,0.834-0.78,1.282-1.133l2.364-1.718c0.08-0.046,0.134-0.096,0.187-0.148c0.946-0.755,2.081-1.395,3.294-2.071 c0.486-0.265,0.957-0.528,1.434-0.812c1.015-0.651,2.062-1.072,3.176-1.518c0.562-0.236,1.111-0.46,1.673-0.701 c0.323-0.128,0.654-0.277,0.979-0.421c0.353-0.145,0.7-0.32,1.053-0.408l2.6-0.73c0.516-0.128,1.116-0.301,1.721-0.476 c0.845-0.247,1.663-0.481,2.213-0.555l6.96-1.018c1.013-0.147,1.91-0.618,2.601-1.3c0.754-0.763,1.26-1.795,1.331-2.93 c0.149-2.164-1.226-4.142-3.304-4.752l-6.859-1.951c-1.193-0.358-2.46-0.544-3.681-0.723c-0.544-0.084-1.1-0.164-1.688-0.262 l-3.003-0.465c-0.942-0.153-1.825-0.175-2.611-0.191c-0.309-0.011-0.621-0.017-0.946-0.033c-0.786-0.011-1.356-0.042-1.944-0.069 c-1.749-0.073-3.727-0.15-5.829,0.124l-1.331,0.107c-2.012,0.167-4.316,0.353-6.63,0.908l-3.71,0.75 c-1.141,0.282-2.096,0.577-3.053,0.875l-1.171,0.358c-2.683,0.744-5.22,1.809-7.677,2.845L83.738,45.2 c-2.107,0.873-4.02,1.893-5.869,2.878l-1.534,0.817c-0.107,0.053-0.189,0.114-0.296,0.17c-0.593,0.369-1.2,0.733-1.789,1.092 c-1.601,0.969-3.268,1.973-4.808,3.117l-2.566,1.831c-0.054,0.046-0.306,0.229-0.369,0.281l-2.539,2.027 c-0.684,0.528-1.315,1.064-1.92,1.593c-4.573,0.761-8.967,2.883-12.49,6.416l-5.437,5.428c-2.503,2.506-4.851,6.02-6.785,9.957 C28.813,79.17,17.248,91.756,0,108.999l38.569,38.55C51.792,134.32,68.396,118.736,66.748,110.213z"></path> <path d="M369.185,107.822l24.298,4.7l24.731-31.226c4.516-5.666,12.027-8.26,19.037-6.602V61.247h-36.526v29.22h-39.338 L369.185,107.822z"></path> <polygon points="148.68,115.712 156.178,90.462 123.438,90.462 "></polygon> <path d="M437.251,247.502v-93.598c-0.657,0.9-1.308,1.809-2.008,2.689c-10.165,12.837-23.654,22.076-38.773,26.996h4.269v63.913 h-85.617h-12.244l45.855-62.523c0.832-1.064,1.598-2.164,2.308-3.289c25.619,6.421,53.806-2.131,71.241-24.134 c12.721-16.061,17.668-36.797,13.56-56.904c-0.456-2.279-2.205-4.082-4.46-4.626c-2.268-0.534-4.636,0.284-6.087,2.101 l-29.557,37.316l-38.427-7.439l-16.044-35.71l29.57-37.319c1.447-1.82,1.699-4.32,0.657-6.394 c-1.045-2.082-3.196-3.366-5.514-3.301c-20.521,0.605-39.579,10.16-52.304,26.22c-17.415,21.992-19.298,51.371-7.218,74.832 c-0.914,0.963-1.812,1.984-2.676,3.07l-59.339,70.592l14.361,14.363c3.721,3.721,6.323,8.23,7.714,13.144h-6.402 c-1.171-3.223-3.021-6.249-5.615-8.836l-81.683-81.698l-2.123,7.122l5.535,1.647c4.165,1.233,7.598,4.016,9.666,7.833 c2.066,3.816,2.525,8.216,1.289,12.377c-0.667,2.23-1.812,4.287-3.324,6.024c0.427,3.817,0.102,7.683-1.023,11.401l-7.335,24.704 l19.426,19.414h-6.224h-13.596h-13.644l14.424-48.561c1.239-4.134,1.134-8.353-0.026-12.197c2.032-1.037,3.664-2.876,4.369-5.239 c1.352-4.578-1.256-9.398-5.839-10.753l-12.821-3.817l34.85-117.3l1.097,0.326l9.028-17.478l3.541-27.259l-15.046-4.465 l-11.71,24.84l-1.881,19.597l1.114,0.332l-34.851,117.307l-13.344-3.963c-4.567-1.36-9.396,1.25-10.753,5.828 c-0.654,2.213-0.385,4.476,0.584,6.388c-3.21,2.605-5.71,6.181-6.978,10.444L97.65,247.502H84.605h-5.267v-63.907h24.253 l4.335-14.613c1.092-3.661,1.839-4.668,4.017-7.721L72.79,121.146c-5.362,7.384-10.671,15.045-18.929,23.242l-11.04,11.029v92.085 H30.942v127.837c0,40.335,32.715,73.042,73.056,73.042H376.09c40.346,0,73.04-32.702,73.04-73.042V247.502H437.251z M150.54,202.099c1.44-4.865,6.551-7.627,11.416-6.188c4.844,1.443,7.62,6.553,6.175,11.414l-11.927,40.178h-19.151 L150.54,202.099z M120.954,193.312c1.441-4.857,6.553-7.626,11.414-6.187c4.859,1.442,7.628,6.551,6.182,11.409l-14.544,48.969 h-19.147L120.954,193.312z"></path> <path d="M197.928,90.462l-14.131,47.568l45.573,45.565h24.428l40.63-48.329c-5.58-14.43-6.841-29.968-4.077-44.805H197.928z"></path> </g> </g> </g></svg>`,
            href: category.toolbox,
            target: "_blank"
        }).appendTo(contentGroup)

        const hintTitle = $(`<p class=hint>Try NOT to take more than 10 seconds to answer each question.</p>`)
        .appendTo(questions).hide()
        const hints = $(`<ol/>`, {
            class: "hint-list",
            html: "<li>Never true of me</li> <li>Seldom true of me <i>(just beginning)</i></li> <li>Sometimes/ occasionally true of me</li> <li>Often/ usually true of me <i>(getting going)</i></li> <li>Always true of me (well developed)</li>"
        }).appendTo(questions).hide()

        $(`<a class="close2 hint">Click here to view the scoring matrix</a>`)
        .click(function (e) {
            e.stopPropagation();
            if ($(this).hasClass("clicked")) {
                $(this).text($(this).text().replace("hide", "view"))
                $(this).removeClass("clicked")
                hintTitle.hide(300)
                hints.hide(300)
            } else {
                $(this).text($(this).text().replace("view", "hide"))
                $(this).addClass("clicked")
                hintTitle.show(300)
                hints.show(300)
            }
            return 
        })
        .appendTo(questions)

        category.questions.forEach((q, index) => {
            const question = $(`<p>${q}</p>`).appendTo(questions)
            const radioGroup = $('<div class=radio-group></div>').appendTo(questions)
            for (let i = 1; i < 6; i++) {
                const input = $("<input/>", {
                    "name": `${category.category}.${index + 1}`,
                    "type": "radio",
                    "id": `${category.category}.${index + 1}.${i}`,
                    "value": i,
                    click: function (e) { 
                        scoreState.updateScore(index, i) 
                    }
                }).appendTo(radioGroup)
                $("<label/>", {
                    "for": `${category.category}.${index + 1}.${i}`,
                    text: i
                }).appendTo(radioGroup)
                if (scoreState.score[index] == i) {
                    input.click()
                }
            }
        })

        if (category.extrahints) {
            category.extrahints.forEach(h => {
                $(`<p class=extrahints>${h}</p>`).appendTo(questions)
            })
        }

        $(`<a class="close2">CLOSE</a>`)
        .click(function (e) {
            e.stopPropagation();
            card.parent().removeClass("open");
        })
        .appendTo([questions])

        card.parent().removeClass("open")
    })
    hintState.init()
}

function loadPrinter() {
    const context = $("<div class='context before-leaving'></div>").append("<h3>Before you leave...</h3>")
    const buttonRow = $('<div/>', {
        "class": "button-row",
    }).appendTo(context.appendTo("#plan"))

    const churchDiv = $('<div/>', {
        "id": "church-icon",
        "class": "button-icons",
        html: `<svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#76523B"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M863.963429 136.045714h-185.051429v-61.732571a61.732571 61.732571 0 0 0-61.805714-61.732572H370.322286a61.732571 61.732571 0 0 0-61.732572 61.732572v61.732571H123.465143C55.296 136.045714 0 191.268571 0 259.437714v555.446857c0 68.169143 55.296 123.392 123.465143 123.392h740.498286c68.169143 0 123.465143-55.222857 123.465142-123.392V259.437714a123.392 123.392 0 0 0-123.465142-123.392z m-493.714286-30.866285c0-17.042286 13.824-30.866286 30.939428-30.866286h185.051429c17.042286 0 30.866286 13.897143 30.866286 30.866286v30.866285H370.322286v-30.866285z m555.446857 709.705142a61.805714 61.805714 0 0 1-61.805714 61.659429H123.465143a61.659429 61.659429 0 0 1-61.732572-61.659429V475.428571h312.905143c-2.779429 10.020571-4.169143 20.406857-4.388571 30.793143a123.465143 123.465143 0 0 0 246.857143 0 122.88 122.88 0 0 0-4.388572-30.866285h313.051429v339.382857h-0.073143z m-493.714286-308.589714c0-11.264 3.291429-21.723429 8.557715-30.866286h106.349714a60.928 60.928 0 0 1 8.557714 30.866286 61.732571 61.732571 0 0 1-123.465143 0z m493.714286-92.525714H61.659429v-154.331429c0-34.084571 27.574857-61.659429 61.732571-61.659428h740.498286c34.084571 0 61.805714 27.574857 61.805714 61.659428v154.331429z" fill="#76523B" style="stroke: white; stroke-width: 30px"></path></g></svg>`,
        click: function () { open("https://www.biblechurch.sg/grip-toolbox", '_blank') },
    }).appendTo(buttonRow)
    .append($('<span/>', {
        text: "GRIP's Toolboxes", 
        class: "button-label",
    }))

    const downloadDiv = $('<div/>', {
        "id": "download-icon",
        "class": "button-icons",
        html: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 10L12 15M12 15L7 10M12 15V3" stroke="#76523B" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
        click: function () { 
            const willDownload = window.confirm("This download may take close to a minute. Proceed with downloading?")
            if (willDownload) {
                createPDFfromHTML() 
            }
        },
    }).appendTo(buttonRow)
    .append($('<span/>', {
        text: "PDF Download", 
        class: "button-label",
    }))

    const copyDiv = $('<div/>', {
        "id": "copy-icon",
        "class": "button-icons",
        html: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="2" stroke="#76523B" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><rect x="11.13" y="17.72" width="33.92" height="36.85" rx="2.5"></rect><path d="M19.35,14.23V13.09a3.51,3.51,0,0,1,3.33-3.66H49.54a3.51,3.51,0,0,1,3.33,3.66V42.62a3.51,3.51,0,0,1-3.33,3.66H48.39"></path></g></svg>`,
        click: function () { copyToClipboard() },
    }).appendTo(buttonRow)
    .append($('<span/>', {
        text: "Copy to Clipboard", 
        class: "button-label",
    }))

    const resetDiv = $('<div/>', {
        "id": "reset-icon",
        "class": "button-icons",
        html: `<svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.56189 13.5L4.14285 13.9294L4.5724 14.3486L4.99144 13.9189L4.56189 13.5ZM9.92427 15.9243L15.9243 9.92427L15.0757 9.07574L9.07574 15.0757L9.92427 15.9243ZM9.07574 9.92426L15.0757 15.9243L15.9243 15.0757L9.92426 9.07574L9.07574 9.92426ZM19.9 12.5C19.9 16.5869 16.5869 19.9 12.5 19.9V21.1C17.2496 21.1 21.1 17.2496 21.1 12.5H19.9ZM5.1 12.5C5.1 8.41309 8.41309 5.1 12.5 5.1V3.9C7.75035 3.9 3.9 7.75035 3.9 12.5H5.1ZM12.5 5.1C16.5869 5.1 19.9 8.41309 19.9 12.5H21.1C21.1 7.75035 17.2496 3.9 12.5 3.9V5.1ZM5.15728 13.4258C5.1195 13.1227 5.1 12.8138 5.1 12.5H3.9C3.9 12.8635 3.92259 13.2221 3.9665 13.5742L5.15728 13.4258ZM12.5 19.9C9.9571 19.9 7.71347 18.6179 6.38048 16.6621L5.38888 17.3379C6.93584 19.6076 9.54355 21.1 12.5 21.1V19.9ZM4.99144 13.9189L7.42955 11.4189L6.57045 10.5811L4.13235 13.0811L4.99144 13.9189ZM4.98094 13.0706L2.41905 10.5706L1.58095 11.4294L4.14285 13.9294L4.98094 13.0706Z" fill="#76523B" style="stroke-width: 0.3px; stroke: white"></path> </g></svg>`,
        click: function () { resetScores() },
    }).appendTo(buttonRow)
    .append($('<span/>', {
        text: "Reset Scores", 
        class: "button-label", 
    }))

    function resetScores() {
        const willReset = window.confirm("Are you REALLY SURE that you want to DELETE all your answers?")
        if (willReset) {
            for (i=1; i<9; i++) {
                localStorage.removeItem(`category${i}scores`);
            }
            location.reload();
        }
        return 
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function createPDFfromHTML() {
        const downloadCounter = {
            currentPage: 1,
            totalPages: 17, 
            increase: function() {
                this.currentPage += 1;
                $("#progressBar").animate({width: `${this.currentPage/this.totalPages*100}%`}, 'fast')
            }
        }

        $("#loadingScreen > p").text("Downloading. Please do not leave the browser.")
        $("#loadingScreen").show()
        $("#downloadBar").show()

        $("body").css({"width":"414px", "height":"896px"})
        $(".hint, .tooltip, a").addClass("print-hide")
        $("#pageContainer, .page, .card, .row, .open, .row-wrapper, .card-wrapper")
            .addClass("print-style")

        let scaleX, scaleY;
        if (HTML_Width < 500) {
            scaleX = 2;
            scaleY = 1;
        } else {
            scaleX = 1;
            scaleY = 1;
        }

        var HTML_Width = $("#pageContainer").width();
        var HTML_Height = $("#pageContainer").height();
        var pdf = new jsPDF('p', 'pt', [HTML_Width, HTML_Height]);

        async function printbody(scaleX = 1, scaleY = 1) {
            var HTML_Width = $("#pageContainer").width();
            var HTML_Height = $("#pageContainer").height();

            await sleep(50)
            await html2canvas($("#pageContainer")[0])
                .then(function (canvas) {
                    var imgData = canvas.toDataURL("image/jpeg", 1.0);
                    pdf.addImage(imgData, 'JPG', 0, 0, HTML_Width * scaleX, HTML_Height * scaleY);
                    pdf.addPage(HTML_Width, HTML_Height);
                })
            downloadCounter.increase()
        }

        async function openclose(element, scaleX = 1, scaleY = 1) {
            $(element).addClass("open")
            await printbody(scaleX, scaleY)
            $(element).removeClass("open")
        }

        $(".card").removeClass("open")
        $(".row").removeClass("open")

        $(".navbutton")[2].click()
        await sleep(600)
        await printbody()
        for (i in $(".row").toArray()) {
            await openclose($(".row").toArray()[i]);
        }

        $(".navbutton")[1].click()
        await sleep(600)
        for (i in $(".card").toArray()) {
            await openclose($(".card").toArray()[i], scaleX, scaleY);
        }

        pdf.save("GRIP.pdf")
        $("body").removeAttr("style")
        $(".hint, .tooltip, a").removeClass("print-hide")
        $("#pageContainer, .page, .card, .row, .open, .row-wrapper, .card-wrapper")
            .removeClass("print-style")

        $("#loadingScreen").text("Loading")
        $("#loadingScreen").hide()
    }

    const copyTip = createToolTip(copyDiv, "Copied!")
    function copyToClipboard() {
        function getText(element) {
            const title = $(element).find("> h4:nth-child(1)").text()
            const score = $(element).find("> h4:nth-child(2)").text()
            let text = `${title} (${score.padStart(2)})`
            return text
        }
        copyTip.show().fadeOut(1500)
        var copyText = $(".row-wrapper").toArray().map(getText).join("\n")
        navigator.clipboard.writeText(copyText);
    }
}

let currentIndex = 0;
function loadbuttons() {
    var selector = "#navbar li"
    $(selector).click(function () {
        const newIndex = parseInt($(this).attr("link-index"))
        if (newIndex == currentIndex) { return }

        $(selector).removeClass("active");
        $(this).addClass("active");
        const diff = newIndex - currentIndex;
        currentIndex = newIndex
        $(".page").animate({
            left: `-=${diff * 100}%`,
            right: `+=${diff * 100}%`,
        });
    })
}