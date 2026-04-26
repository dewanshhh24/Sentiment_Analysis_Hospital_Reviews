# MediSense AI

MediSense AI is a hybrid sentiment analysis system designed for healthcare reviews. It combines transformer-based contextual embeddings with a gradient boosting classifier to deliver accurate and computationally efficient multi-class sentiment classification.

## Overview

Understanding patient feedback at scale is essential for improving healthcare services. Traditional machine learning methods struggle with contextual language, while fully fine-tuned transformer models require significant computational resources. MediSense AI addresses this by decoupling feature extraction and classification.

The system uses a pretrained RoBERTa model as a frozen feature extractor and feeds the resulting embeddings into an XGBoost classifier for sentiment prediction.

## Features

* Multi-class sentiment classification (Negative, Neutral, Positive)
* Hybrid architecture combining RoBERTa and XGBoost
* Efficient training without full transformer fine-tuning
* Balanced dataset handling for improved generalization
* Designed for real-time healthcare feedback analysis

## Dataset

The dataset is derived from the Yelp Open Dataset, filtered to include healthcare-related categories such as hospitals, clinics, and medical services.

* Total reviews: 76,495
* Balanced dataset: 18,000 (6,000 per class)
* Classes: Negative, Neutral, Positive
* Train-test split: 80:20

Labels are assigned based on star ratings and manual verification.

## Methodology

1. Data Preprocessing
   Text cleaning, contraction expansion, and tokenization are applied. Reviews are truncated or padded to a maximum length of 128 tokens.

2. Feature Extraction
   RoBERTa-base is used to generate 768-dimensional CLS embeddings for each review. The model is used as a frozen encoder.

3. Classification
   The embeddings are used as input to an XGBoost classifier configured with regularization and optimized hyperparameters.

4. Evaluation
   The model is evaluated using Accuracy, Precision, Recall, F1-score, and AUC-ROC.

## Results

The proposed hybrid model achieves:

* Accuracy: 0.86
* Macro F1-score: 0.86

Performance comparison:

| Model        | Accuracy | F1-score |
| ------------ | -------- | -------- |
| BERT-Cased   | 0.79     | 0.79     |
| BERT-Uncased | 0.82     | 0.82     |
| RoBERTa      | 0.86     | 0.86     |
| MediSense AI | 0.86     | 0.86     |

The results demonstrate that the hybrid approach achieves performance comparable to fine-tuned transformers with lower computational cost.

## Project Structure

```
MediSense-AI/
│
├── data/                # Dataset and preprocessing outputs
├── notebooks/           # EDA and experimentation
├── src/
│   ├── preprocessing.py
│   ├── embedding.py
│   ├── train.py
│   ├── evaluate.py
│
├── models/              # Saved models and embeddings
├── results/             # Graphs and evaluation outputs
├── requirements.txt
└── README.md
```

## Installation

Clone the repository:

```
git clone https://github.com/your-repository-link
cd MediSense-AI
```

Install dependencies:

```
pip install -r requirements.txt
```

## Usage

Run preprocessing:

```
python src/preprocessing.py
```

Generate embeddings:

```
python src/embedding.py
```

Train the model:

```
python src/train.py
```

Evaluate performance:

```
python src/evaluate.py
```

## Applications

* Healthcare feedback monitoring
* Hospital quality assessment
* Patient experience analytics
* Policy evaluation and public sentiment tracking

## Limitations

* Limited to English-language reviews
* Downsampling may remove useful data
* Document-level classification does not capture aspect-level sentiment
* Frozen embeddings may not fully capture domain-specific medical terminology

## Future Work

* Domain-adaptive pretraining on medical corpora
* Aspect-based sentiment analysis
* Integration of explainability techniques such as SHAP
* Deployment as a real-time analytics system

## Citation

If you use this work, please cite the associated research paper.

## License

This project is intended for academic and research purposes.
