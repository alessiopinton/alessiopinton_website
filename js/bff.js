const lessThan_sign = "<".charCodeAt(0);
const greaterThan_sign = ">".charCodeAt(0);
const left_curly_bracket = "{".charCodeAt(0);
const right_curly_bracket = "}".charCodeAt(0);
const plus_sign = "+".charCodeAt(0);
const hypenMinus = "-".charCodeAt(0);
const full_stop = ".".charCodeAt(0);
const comma = ",".charCodeAt(0);
const left_square_bracket = "[".charCodeAt(0);
const right_square_bracket = "]".charCodeAt(0);
const rules = "<>{}-+.,[]";

let cachedFont = "12px monospace";

function arrayGenerator(str_quantity, str_size) {
    const array = [];
    for (let str = 0; str < str_quantity; str++) {
        const string = new Uint8Array(str_size)
        for (let chr = 0; chr < str_size; chr++) {
            string[chr] = Math.floor(Math.random() * 128)
        }
        array.push(string)
    }
    return array
}

function randomInt(max) {
    const int = Math.floor(Math.random() * max)
    return int
}

function strings_choice(str_quantity) {
    const chosen_strings_index = [];
    const string1_index = randomInt(str_quantity);
    let string2_index = randomInt(str_quantity);
    while (string2_index === string1_index) {
        string2_index = randomInt(str_quantity);
    }
    chosen_strings_index.push(string1_index, string2_index)
    return chosen_strings_index
}

function merge_strings(soup, indices) {
    const string1 = soup[indices[0]];
    const string2 = soup[indices[1]];
    const joined_strings = new Uint8Array(string1.length + string2.length)
    joined_strings.set(string1, 0);
    joined_strings.set(string2, string1.length);
    return joined_strings
}

function split_tape(tape) {
    const string1 = tape.slice(0, tape.length / 2);
    const string2 = tape.slice(tape.length / 2, tape.length);
    return [string1, string2];
}

function replace_strings(soup, string1, string2, indices) {
    const population = soup;
    population[indices[0]] = string1;
    population[indices[1]] = string2;
}

function interpreter(byte_amplitude, string) {
    const tape = string.slice()
    let instruction_pointer = 0;
    let reading_location = 0;
    let writing_location = 0;
    let steps = 0;
    let max_steps = 10000;

    while (instruction_pointer < tape.length && steps < max_steps) {
        let current_reading = tape[instruction_pointer]

        if (current_reading === lessThan_sign) {
            reading_location = ((reading_location + tape.length) - 1) % tape.length;
        }
        else if (current_reading === greaterThan_sign) {
            reading_location = (reading_location + 1) % tape.length;
        }
        else if (current_reading === left_curly_bracket) {
            writing_location = ((writing_location + tape.length) - 1) % tape.length;
        }
        else if (current_reading === right_curly_bracket) {
            writing_location = (writing_location + 1) % tape.length;
        }
        else if (current_reading === hypenMinus) {
            tape[reading_location] = ((tape[reading_location] + byte_amplitude) - 1) % byte_amplitude;
        }
        else if (current_reading === plus_sign) {
            tape[reading_location] = (tape[reading_location] + 1) % byte_amplitude;
        }
        else if (current_reading === full_stop) {
            tape[writing_location] = tape[reading_location];
        }
        else if (current_reading === comma) {
            tape[reading_location] = tape[writing_location];
        }
        else if (current_reading === left_square_bracket) {
            if (tape[reading_location] === 0) {
                let bracket_counter = 1;
                let bracket_instruction_pointer = instruction_pointer;

                while (bracket_counter > 0) {
                    bracket_instruction_pointer++;
                    if (bracket_instruction_pointer >= tape.length) {
                        break
                    }
                    else if (tape[bracket_instruction_pointer] === left_square_bracket) {
                        bracket_counter++;
                    }
                    else if (tape[bracket_instruction_pointer] === right_square_bracket) {
                        bracket_counter--;
                    }
                }
                if (bracket_counter === 0) {
                    instruction_pointer = bracket_instruction_pointer;
                }
                else {
                    instruction_pointer = tape.length
                }
            }
        }
        else if (current_reading === right_square_bracket) {
            if (tape[reading_location] !== 0) {
                let bracket_counter = 1;
                let bracket_instruction_pointer = instruction_pointer;

                while (bracket_counter > 0) {
                    bracket_instruction_pointer--;
                    if (bracket_instruction_pointer < 0) {
                        break
                    }
                    else if (tape[bracket_instruction_pointer] === right_square_bracket) {
                        bracket_counter++
                    }
                    else if (tape[bracket_instruction_pointer] === left_square_bracket) {
                        bracket_counter--
                    }
                }
                if (bracket_counter === 0) {
                    instruction_pointer = bracket_instruction_pointer;
                }
                else {
                    instruction_pointer = tape.length;
                }
            }
        }
        steps++
        instruction_pointer++
    }
    return tape
}

function cycle(soup, brightness, byte_amplitude) {
    const selected_strings = strings_choice(soup.length);
    const tape = merge_strings(soup, selected_strings);
    const computed = interpreter(byte_amplitude, tape);
    const new_strings = split_tape(computed);
    for (let k = 0; k < 2; k++) {
        for (let c = 0; c < new_strings[k].length; c++) {
            const new_symbol = String.fromCharCode(new_strings[k][c]);
            if (soup[selected_strings[k]][c] !== new_strings[k][c] && rules.includes(new_symbol)) {
                brightness[selected_strings[k]][c] = 1;
            }
        }
    }
    replace_strings(soup, new_strings[0], new_strings[1], selected_strings);
}

function draw(ctx, soup, brightness, cell_width, cell_height) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = cachedFont;

    if (document.documentElement.classList.contains("dark")) {
        ctx.fillStyle = "#FFFFFF";
    }
    else {
        ctx.fillStyle = "#000000";
    }
    for (let r = 0; r < brightness.length; r++) {
        for (let c = 0; c < brightness[r].length; c++) {
            if (brightness[r][c] > 0.02) {
                ctx.globalAlpha = brightness[r][c];
                const current_symbol = String.fromCharCode(soup[r][c]);
                if (rules.includes(current_symbol)){
                    ctx.fillText(current_symbol, c * cell_width, (r + 1) * cell_height);
                }
            }
        }       
    }
    ctx.globalAlpha = 1;
}

function frame() {
    for (let c = 0; c < cycles_per_tick; c++) {
        cycle(soup, brightness, 128)
    }
    fade(brightness, decay);
    draw(ctx, soup, brightness, cell_width, cell_height);
    requestAnimationFrame(frame);
}

function illuminate(rows, cols) {
    const array = [];
    for (let str = 0; str < rows; str++) {
        const string = new Float32Array(cols)
        array.push(string)
    }
    return array
}

function fade(brightness, decay) {
    for (let r = 0; r < brightness.length; r++) {
        for (let c = 0; c < brightness[r].length; c++) {
            brightness[r][c] *= decay;
        }
    }
}

const canvas = document.getElementById("bff");
const ctx = canvas.getContext("2d");

const cell_width = 12;
const cell_height = 16;
const cycles_per_tick = 1; 
const decay = 0.99;

let rows = 0;
let cols = 0;
let soup = [];
let brightness = [];

function resizeAndRebuild() {
    const rect = canvas.getBoundingClientRect();
    
    const siteStyle = window.getComputedStyle(document.body);
    ctx.font = `0.75rem ${siteStyle.fontFamily}`;

    const new_cols = Math.floor(rect.width / cell_width);
    const new_rows = Math.floor(rect.height / cell_height);
    
    if (new_cols !== cols || new_rows !== rows) {
        cols = new_cols > 0 ? new_cols : 1;
        rows = new_rows > 0 ? new_rows : 1;
        
        canvas.width = cols * cell_width;
        canvas.height = rows * cell_height;
        
        soup = arrayGenerator(rows, cols);
        brightness = illuminate(rows, cols);
    }
}

const resizeObserver = new ResizeObserver(() => {
    resizeAndRebuild();
});
resizeObserver.observe(canvas.parentElement || document.body);

resizeAndRebuild();

requestAnimationFrame(frame);