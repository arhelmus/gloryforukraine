	package main

	import (
		"fmt"
		"net/http"
		"math/rand"
	)

	// func getHost() string {
	// 	in := []string{"https://www.smotrim.ru"}
	// 	randomIndex := rand.Intn(len(in))
	// 	return in[randomIndex]
	// }

	func handler(w http.ResponseWriter, r *http.Request) {
		fmt.Println("request recieved")
		w.Write([]byte("udp 194.67.7.1:53 2 1000 socks5.txt"))
	}

	func main() {
		http.HandleFunc("/", handler)
		http.HandleFunc("/polyanicia", handler)

		fmt.Println("listening on 0.0.0.0, port 80")
		fmt.Println(string("\033[33m"), `
	██████████████████████████████
	██████████████░░██████████████
	████░████████░░░░████████░████
	████░░░██████░░░░██████░░░████
	████░█░░░█████░░██████░░█░████
	████░██░░█████░░█████░░██░████
	████░███░░████░░████░░███░████
	████░███░░████░░████░░███░████
	████░███░░████░░████░░███░████
	████░████░░███░░███░░████░████
	████░████░░███░░███░░████░████
	████░██░░░███░░░░███░░░██░████
	████░██░░███░░██░░███░░██░████
	████░██░░░██████████░░░██░████
	████░████░░░░░██░░░░░████░████
	████░█████░░██░░██░░█████░████
	████░░░░░░░░░░░░░░░░░░░░░░████
	██████████░░██░░██░░██████████
	░██████████░░█░░█░░██████████
	░░██████████░░░░░░██████████
	░░░░█████████░░░░█████████
	░░░░░░░░██████████████
	░░░░░░░░░░░░░████

	Glory for Ukraine
	`, string("\033[0m"))
		err := http.ListenAndServe(":80", nil)

		if err != nil {
			fmt.Println("Error starting ping server: ", err)
		}
	}
