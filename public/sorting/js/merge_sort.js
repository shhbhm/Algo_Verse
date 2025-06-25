import {
    n,
    width,
    speed
} from "./main_sort.js";

var c_delay = 0;
var delay_time = 10000 / (Math.floor(n / 30) * speed);

function div_update(cont, h, color) {
    setTimeout(function() {
        cont.style =
            " background:" + color + "; width:" + width + "%;" +
            "box-shadow: 2px -2px 3px #5F5F5F, 2px -2px 3px white; " +
            " height:" + h + "%;";
    }, c_delay += delay_time);
}

function merge(divs, height, l, m, r) {
    var i = l;
    var j = m + 1;
    var temp = [];
    var k = 0;

    while (i <= m && j <= r) {
        // Color the elements being compared
        div_update(divs[2 * i + 1], height[i], "red");
        div_update(divs[2 * j + 1], height[j], "red");

        if (height[i] <= height[j]) {
            div_update(divs[2 * i + 1], height[i], "green");
            temp[k++] = height[i++];
        } else {
            div_update(divs[2 * j + 1], height[j], "green");
            temp[k++] = height[j++];
        }
    }

    while (i <= m) {
        div_update(divs[2 * i + 1], height[i], "red");
        temp[k++] = height[i++];
        div_update(divs[2 * (i - 1) + 1], height[i - 1], "green");
    }

    while (j <= r) {
        div_update(divs[2 * j + 1], height[j], "red");
        temp[k++] = height[j++];
        div_update(divs[2 * (j - 1) + 1], height[j - 1], "green");
    }

    // Copy back the merged elements
    for (i = 0; i < k; i++) {
        height[l + i] = temp[i];
        div_update(divs[2 * (l + i) + 1], height[l + i], "green");
    }
}

export function mergeSort(divs, height) {
    c_delay = 0;
    delay_time = 10000 / (Math.floor(n / 30) * speed);
    
    function mergeSortRec(l, r) {
        if (l < r) {
            var m = Math.floor((l + r) / 2);
            
            // Sort first and second halves
            mergeSortRec(l, m);
            mergeSortRec(m + 1, r);
            
            // Merge the sorted halves
            merge(divs, height, l, m, r);
        }
    }
    
    mergeSortRec(0, n - 1);
} 