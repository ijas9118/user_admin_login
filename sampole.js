let arr = [1, 3, 2, 1, 1, 1, 3, 4, 2, 2, 2, 2, 3];
let freq = {};

for (let i = 0; i < arr.length; i++) {
  if (freq[arr[i]]) {
    freq[arr[i]]++;
  } else {
    freq[arr[i]] = 1;
  }
}

console.log(freq);

let max = arr[0]; 
for (let key in freq) {
  if (freq[key] > freq[max]) {
    max = key;
  }
}

console.log(freq[max] + " = " + max);
