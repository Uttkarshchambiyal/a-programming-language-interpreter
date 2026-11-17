-- Hello World in Flux

let name = "World"
"Hello, " + name + "!" |> print

-- Pipeline magic
let nums = [1, 2, 3, 4, 5]
nums |> map(fn(x) { return x * 2 }) |> print
nums |> filter(fn(x) { return x > 3 }) |> print
