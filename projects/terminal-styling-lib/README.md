## Best Practices

1. Css-переменные должны начинаться с префикса "ats". Большая вероятность, что в будущих релизах ng-zorro темы будут настраиваться через css-переменные. Префикс нужен чтобы избежать конфликтов именования.

### Architecture Diagram

```mermaid
graph TD
    subgraph terminal-styling-lib - src/styles/themes
        LV[light/variables.less<br/>Less variable overrides]
        DV[dark/variables.less<br/>Less variable overrides]
        CVM[css-vars-mapping.less<br/>Less vars to CSS custom props]
        CV[const-variables.less<br/>theme-independent constants]
        LT[light-theme.less<br/>entry file]
        DT[dark-theme.less<br/>entry file]
    end

    subgraph ng-zorro
        NZL[ng-zorro-antd/ng-zorro-antd.less<br/>default light theme]
        NZD[ng-zorro-antd/ng-zorro-antd.dark.less<br/>dark theme]
    end

    subgraph UI Project - angular.json styles
        LB[light-theme.css bundle<br/>inject: false]
        DB[dark-theme.css bundle<br/>inject: false]
        PS[project styles.less<br/>optional overrides]
    end

    subgraph Runtime
        ATH[ApplyThemeHook<br/>toggles link tags]
    end

    NZL --> LT
    LV --> LT
    CVM --> LT
    CV --> LT
    
    NZD --> DT
    NZL --> DT
    DV --> DT
    CVM --> DT
    CV --> DT
    
    LT --> LB
    DT --> DB
    ATH --> LB
    ATH --> DB
```
