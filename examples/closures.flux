-- Closures in Flux
-- A closure captures variables from its parent scope

fn counter(start) {
  let count = start
  return fn() {
    count = count + 1
    return count
  }
}

let next = counter(0)
next() |> print  -- 1
next() |> print  -- 2
next() |> print  -- 3

-- Two independent counters
let a = counter(10)
let b = counter(100)
a() |> print  -- 11
b() |> print  -- 101
a() |> print  -- 12
b() |> print  -- 102

-- Higher-order function: a function that returns a multiplier
fn multiplier(factor) {
  return fn(x) {
    return x * factor
  }
}

let double = multiplier(2)
let triple = multiplier(3)

5 |> double |> print  -- 10
5 |> triple |> print  -- 15

-- Chaining pipelines
5 |> double |> triple |> print  -- 30
