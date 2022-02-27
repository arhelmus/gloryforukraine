package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"math/rand"
	"time"
)

func loadConfigs(url string) ([]string, error) {
	httpClient := http.Client {
		Timeout: time.Second * 1,
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return []string{}, err
	}

	res, err := httpClient.Do(req)
	if err != nil {
		return []string{}, err
	}

	if res.Body != nil {
		defer res.Body.Close()
	}

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return []string{}, err
	}

	var configs []string
	err = json.Unmarshal(body, &configs)
	if err != nil {
		return []string{}, err
	}

	return configs, nil
}

func randomItem(items []string) string {
	randomIndex := rand.Intn(len(items))
    return items[randomIndex]
}

func main() {
	rand.Seed(time.Now().UnixNano())

	for {
		configs, err := loadConfigs("https://gloryforukraine.pages.dev/targets.json")
		if err != nil {
			log.Println(err)
			time.Sleep(2 * time.Second)
			continue
		}

		fmt.Println(configs)
		fmt.Println(randomItem(configs))
	}
}
