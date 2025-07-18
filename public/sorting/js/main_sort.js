// Imported Functions
import {
    bubble
} from "./bubble_sort.js";
import {
    heap
} from "./heap_sort.js";
import {
    quick
} from './quick_sort.js';
import {
    insertion
} from './insertion_sort.js';
import {
    selection
} from './selection_sort.js';
import {
    mergeSort
} from './merge_sort.js';

// variables
var refreshbtn = document.getElementById('refresh');
var startbtn = document.getElementById('start');
var container = document.querySelector('ArrayBox');
var ArrayBox = document.getElementById("ArrayBox");
var speed_id = document.querySelector('speed');
var count = document.querySelector('count');
let algoMenu = document.querySelector('#algo');

let algo = algoMenu.value;
algoMenu.addEventListener('change', (e) => {
    algo = algoMenu.value;
})
var arr = [];
var divs = [];
var sliderCount = document.getElementById('count');
var sliderSpeed = document.getElementById('speed');
export var n = sliderCount.value
export var speed = sliderSpeed.value
export var width = 100 / (n * 1.3);


// Event Listeners
refreshbtn.addEventListener('click', refresh);
startbtn.addEventListener('click', start);

// Assigning Default values to Array size and Visual Speed
if (count == null) count = 60;
if (speed_id == null) speed_id = 10;

ArrayBox.style = "flex-direction:row";

// Function for Generating Array
function GenerateArr() {
    ArrayBox.innerHTML = "";
    for (var i = 0; i < n; i++) {
        arr[i] = 1 + (Math.floor(Math.random() * 500) + 101) % 98;
        divs[2 * i] = document.createElement("div");
        divs[2 * i + 1] = document.createElement("div");
        ArrayBox.appendChild(divs[2 * i]);
        ArrayBox.appendChild(divs[2 * i + 1]);
        divs[2 * i].className = "array-margin";
        divs[2 * i + 1].className = "array-bar";
        divs[2 * i].style = "width: " + (width/4) + "%;";
        divs[2 * i + 1].style =
            "background: #808080; width:" + width + "%;" +
            "box-shadow: 1px -1px 2px #5F5F5F, 1px -1px 2px white; " +
            "height:" + arr[i] + "%;";
    }
}

function start() {
    if (algo === "bubble") bubble(divs, arr);
    else if (algo === "quick") quick(divs, arr);
    else if (algo === "heap") heap(divs, arr);
    else if (algo === "selection") selection(divs, arr);
    else if (algo === "insertion") insertion(divs, arr);
    else if (algo === "merge") mergeSort(divs, arr);

}

function refresh() {
    location.reload();
}

// Changing the size of array on changing the array count slider
sliderCount.oninput = function() {
    n = sliderCount.value;
    width = 100 / (n * 1.3);
    GenerateArr();
}

// Changing the speed of array on changing the value of Visual Speed Slider
sliderSpeed.oninput = function() {
    speed = sliderSpeed.value;
}

window.onload = () => {
    GenerateArr();
};