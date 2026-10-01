<?php
// Kontaktformular für handwerksdoktor.de (läuft auf dem IONOS-Webspace).
// Kein externer Dienst, kein Captcha, keine Speicherung: Die Nachricht wird nur per E-Mail weitergeleitet.
// Spamschutz: verstecktes Feld (Honeypot) + Mindestzeit zwischen Seitenaufruf und Absenden.

const EMPFAENGER = 'info@handwerksdoktor.de';
// Absender muss eine Adresse der eigenen Domain sein, sonst landen die Mails im Spam.
// Das Postfach im IONOS-Konto anlegen (im Webhosting-Paket enthalten).
const ABSENDER = 'info@handwerksdoktor.de';

function weiter(string $pfad): void {
    header('Location: ' . $pfad, true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    weiter('/kontakt/');
}

$name      = trim((string)($_POST['name'] ?? ''));
$email     = trim((string)($_POST['email'] ?? ''));
$nachricht = trim((string)($_POST['nachricht'] ?? ''));
$honeypot  = (string)($_POST['website'] ?? '');
$zeit      = (string)($_POST['t'] ?? '');

// Bots: stillschweigend auf „Danke“ leiten, damit sie nichts lernen.
if ($honeypot !== '' || (ctype_digit($zeit) && time() - (int)$zeit < 3)) {
    weiter('/kontakt/danke/');
}

// Zeilenumbrüche in Kopfzeilen-Feldern verhindern (Header-Injection).
$name  = preg_replace('/[\r\n]+/', ' ', mb_substr($name, 0, 100));
$email = preg_replace('/[\r\n]+/', '', mb_substr($email, 0, 200));
$nachricht = mb_substr($nachricht, 0, 5000);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $nachricht === '') {
    weiter('/kontakt/fehler/');
}

$betreff = mb_encode_mimeheader('Kontaktformular: ' . ($name !== '' ? $name : $email), 'UTF-8', 'B');
$text = "Neue Nachricht über handwerksdoktor.de/kontakt\n\n"
      . "Name: " . ($name !== '' ? $name : '(nicht angegeben)') . "\n"
      . "E-Mail: $email\n\n"
      . $nachricht . "\n";

$header = implode("\r\n", [
    'From: Der Handwerksdoktor <' . ABSENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$ok = mail(EMPFAENGER, $betreff, $text, $header, '-f' . ABSENDER);
weiter($ok ? '/kontakt/danke/' : '/kontakt/fehler/');
