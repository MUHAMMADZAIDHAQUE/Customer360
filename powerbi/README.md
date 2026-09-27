# Customer360 - Power BI Analytics Layer
========================================

Welcome to the **Power BI Analytics Layer** for the Customer360 platform.

This directory contains the production-grade Power BI assets, star schema semantic model definitions, DAX measures library, custom dark theme, and the multi-page Power BI Project (`.pbip`).

---

## Directory Structure

```
powerbi/
├── Customer360.pbip               <- Main Power BI Project file (double-click to open in Power BI Desktop)
├── Customer360.Dataset/           <- Semantic model metadata
│   ├── definition.pbidataset      <- Dataset manifest
│   └── model.bim                  <- Complete Tabular Object Model (TOM) with relationships & DAX
├── Customer360.Report/            <- Multi-page report layout & visual containers
│   ├── definition.pbir            <- Report manifest
│   └── report.json                <- 6-page report definition, visuals, dark styling & questions
├── data/                          <- Curated star schema extracts (Parquet and CSV formats)
│   ├── DimCustomer.parquet / .csv
│   ├── DimDate.parquet / .csv
│   ├── DimPlan.parquet / .csv
│   ├── DimContract.parquet / .csv
│   ├── DimRegion.parquet / .csv
│   ├── DimAcquisitionChannel.parquet / .csv
│   ├── FactTransactions.parquet / .csv
│   ├── FactEngagement.parquet / .csv
│   ├── FactSupport.parquet / .csv
│   └── FactChurn.parquet / .csv
├── dax/
│   └── measures.dax               <- Authoritative DAX measure expressions and comments
├── model/
│   └── model.bim                  <- Standalone Tabular Model JSON
├── scripts/
│   ├── build_star_schema.py       <- Python builder generating Star Schema from dbt marts & ML
│   ├── export_powerbi_views.sql   <- SQL DDL creating 'pbi' schema views in PostgreSQL
│   ├── generate_report_json.py    <- Python script generating 6-page report layout specification
│   └── power_query_m_transforms.pq<- Power Query M recipes for loading and type transforms
└── theme/
    └── customer360_dark_theme.json<- Enterprise dark theme color palette and visual styling
```

---

## Quickstart

### 1. Generate Star Schema Datasets
To build or refresh the dimensional data model from the latest dbt marts and machine learning predictions:
```bash
python powerbi/scripts/build_star_schema.py
```
This generates high-performance Parquet and CSV files in `powerbi/data/`.

### 2. Open the Power BI Project
Double-click `Customer360.pbip` or open it from Power BI Desktop (Version May 2023 or newer).

### 3. Report Pages
The report includes 6 dark-themed analytical pages designed around specific business questions:
1. **Executive Overview**: High-level health, growth momentum, and recurring revenue trajectory.
2. **Churn Analysis**: Lifecycle hazard curves, cancellation reasons, and support friction impact.
3. **Customer Segmentation**: Behavioral RFM 3D bubble chart, plan composition, and retention playbooks.
4. **Cohort Retention**: Triangular cohort retention matrix heatmap and contract survival curves.
5. **Revenue Analytics**: MRR/ARR velocity, invoicing failure correlation, and vulnerable account roster.
6. **Churn Prediction**: Supervised ML predictions, SHAP feature attribution, and CSM intervention watchlist.

---

## Detailed Documentation

For full details on the star schema ERD, table dictionary, relationship cardinality, 20 DAX measures, and enterprise gateway refresh configuration, refer to:
* **[docs/powerbi_analytics_guide.md](../docs/powerbi_analytics_guide.md)**
