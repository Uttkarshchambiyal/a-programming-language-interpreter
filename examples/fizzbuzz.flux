-- FizzBuzz in Flux

fn fizzbuzz(n) {
  if n % 15 == 0 {
    return "FizzBuzz"
  } elif n % 3 == 0 {
    return "Fizz"
  } elif n % 5 == 0 {
    return "Buzz"
  } else {
    return n
  }
}

let i = 1
while i <= 30 {
  i |> fizzbuzz |> print
  i = i + 1
}
