<!--graphics-->
FillCircle
==========

```eppabasic
Sub FillCircle(x As Integer, y As Integer, r As Integer)
```

Piirtää näytölle `r`-säteisen täytetyn ympyrän koordinaatteihin (`x`, `y`).
Koordinaatit määrittävät ympyrän keskipisteen.
Käytettävä väri asetetaan komennolla [FillColor](manual:fillcolor).

[Katso, miten koordinaatisto toimii EppaBasicissa](manual:/coordinates).

Esimerkki
----------
```eppabasic
' Piirretään pisteen (100, 120) ympärille täytetty ympyrä, jonka säde on 50
FillCircle 100, 120, 50
```
