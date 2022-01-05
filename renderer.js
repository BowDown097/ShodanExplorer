const dialog = require("@electron/remote").dialog;
const open = require("open");
const prompt = require("electron-prompt");
const sanitizer = require("sanitizer");
const shodanClient = require("shodan-client");

const resultsDiv = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

var searchPage = 1;
var searchTotal = 0;

function makeMatchElement(product, http, timestamp, data, ip_str, port, loc)
{
    var entry = document.createElement("div");
    var line = document.createElement("div");
    line.style = "border-style: solid; border-color: white; border-width: 1px; opacity: 0.1;";

    var title = document.createElement("div");
    var header = document.createElement("span");
    header.innerHTML = http?.title ? http.title : product ? product : ip_str;
    header.style.fontSize = "22px";
    if (http?.favicon?.data && http?.favicon?.hash)
    {
        var titleImg = document.createElement("img");
        titleImg.src = "data:image/x-icon;base64," + http.favicon.data;
        titleImg.title = "Hash: " + http.favicon.hash;
        titleImg.width = 16;
        titleImg.height = 16;
        title.append(titleImg);
    }
    title.append(header);

    var locElem = document.createElement("div");
    var countryImg = document.createElement("img");
    countryImg.src = "https://www.shodan.io/static/flags/16/" + loc.country_code + ".png";
    countryImg.width = 16;
    countryImg.height = 16;
    var city = document.createElement("span");
    city.innerHTML = loc.city + ", " + loc.country_name;
    city.style.fontSize = "12px";
    locElem.append(countryImg);
    locElem.append(city);

    var ipElem = document.createElement("span");
    ipElem.innerHTML = ip_str + ":" + port;
    ipElem.onclick = () => open("http://" + ip_str + ":" + port);
    ipElem.style = "cursor: pointer; font-size: 12px; opacity: 0.5;";

    var ts = document.createElement("span");
    ts.innerHTML = timestamp ?? "";
    ts.style = "font-size: 12px; opacity: 0.5;";

    var dataE = document.createElement("div");
    dataE.innerHTML = data ? "<pre>" + sanitizer.sanitize(data).slice(0, 300) + "</pre>" : "";

    entry.append(title, locElem, ipElem, document.createElement("br"), ts, dataE);
    entry.prepend(line);
    return entry;
}

function performSearch()
{
    resultsDiv.innerHTML = "";

    const query = searchInput.value;
    const key = document.getElementById("keyInput").value;
    if (!query || !key)
    {
        dialog.showErrorBox("Bad Input", "Empty search query or API key");
        return;
    }

    shodanClient.search(query, key, { page: searchPage } )
    .then(res => {
        searchTotal = res.total;
        const viewEnd = searchTotal > 100 ? 100 * searchPage : searchTotal;
        const viewStart = searchTotal > 100 ? viewEnd - 99 : 1;
        document.getElementById("resultsCount").innerHTML = "Results: " + searchTotal + " (Viewing: " + viewStart + "-" + viewEnd + ") • ";
        for (const m of res.matches)
        {
            resultsDiv.append(makeMatchElement(m.product, m.http, m.timestamp, m.data, m.ip_str, m.port, m.location));
        }
    })
    .catch(err => dialog.showErrorBox("Error", err.message));
}

document.getElementById("jump").addEventListener("click", function(event)
{
    prompt({
        title: "Jump to Page",
        label: "Jump to: ",
        value: "2",
        inputAttrs: {
            type: "number",
            required: true
        }
    })
    .then((r) => {
        searchPage = r;
        performSearch();
    })
    .catch(err => dialog.showErrorBox("Error", err.message));
});

document.getElementById("next").addEventListener("click", function(event)
{
    if (searchTotal <= 100)
    {
        dialog.showErrorBox("Error", "There is not another page to go to");
        return;
    }
    searchPage++;
    performSearch();
});

document.getElementById("prev").addEventListener("click", function(event)
{
    if (searchPage == 1)
    {
        dialog.showErrorBox("Error", "You're on the first page and can't go back");
        return;
    }
    searchPage--;
    performSearch();
});

searchInput.addEventListener("keyup", function(event) 
{
    if (event.keyCode === 13) // enter key pressed
    {
        searchPage = 1;
        performSearch();
    }
});
