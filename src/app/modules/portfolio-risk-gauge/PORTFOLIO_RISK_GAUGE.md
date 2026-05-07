# Portfolio Risk Gauge

This widget shows one portfolio-wide risk state based on the adequacy level
(`UD`). Risk managers define `UD` as:

```text
UD = portfolioEvaluation / minimalMargin
```

Both fields come from the portfolio risks API / subscription:

```text
/md/v2/Clients/{exchange}/{portfolio}/risk
RisksGetAndSubscribe
```

The old split calculation by NPR and FORTS-specific free funds is not used.
The same `UD` calculation applies to stock, derivatives, and united portfolios.

## Source Fields

| API field | Meaning |
| --- | --- |
| `portfolioEvaluation` | Liquid portfolio value used for adequacy calculation |
| `minimalMargin` | Minimum margin |

If `minimalMargin <= 0`, the widget shows `GREEN` with "No minimum margin
requirement" because there is no margin load to calculate. If `UD` is zero or
negative, the widget shows `CRITICAL`. If data is missing, invalid, or the
subscription fails, the widget shows `NO_DATA`.

## States

The state is calculated from lowest threshold to highest severity:

```text
CRITICAL           UD <= 0.7
FORCED_CLOSE_RISK  UD < 1.0
RED                UD <= 1.2
RESTRICTED         UD <= 2.0
YELLOW             UD <= 2.6
GREEN              UD > 2.6
NO_DATA            No valid risk data
```

Displayed labels:

```text
GREEN              Calm
YELLOW             Attention
RESTRICTED         Restricted
RED                Critical
FORCED_CLOSE_RISK  Forced close risk
CRITICAL           Critically low reserve
NO_DATA            No data
```

## Gauge Scale

The gauge keeps safe values on the left and higher risk on the right. The
needle uses a visual cap of `UD = 3.0`:

```text
gaugeValuePercent = clamp((3.0 - UD) / 3.0 * 100, 0, 100)
```

Values above `3.0` remain `GREEN` and clamp to the left edge. The displayed
number is the decimal `UD` multiplier, for example `UD 2.60x`.

## Example States

```text
99980 / 38450 = 2.6003 -> GREEN
99970 / 38450 = 2.6000 -> YELLOW
76900 / 38450 = 2.0000 -> RESTRICTED
46140 / 38450 = 1.2000 -> RED
38440 / 38450 = 0.9997 -> FORCED_CLOSE_RISK
26915 / 38450 = 0.7000 -> CRITICAL
```
