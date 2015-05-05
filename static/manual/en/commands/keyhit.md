<!--input-->
KeyHit
=====

```eppabasic
Function KeyHit(näppäin As Integer) As Boolean
```

Palauttaa tiedon, onko näppäintä `näppäin` näppäin painettu funktion viimeisen kutsun jälkeen.

Funktion kutsuminen kahdesti peräkkäin palauttaa toisella kerralla aina arvon False.

[Lista näppäinkoodeista](manual:keycodes)

Example
---------
```eppabasic
Do
    If KeyHit(32) Then
        Print "Painoit välilyöntiä"
    End If
    DrawScreen
Loop
```