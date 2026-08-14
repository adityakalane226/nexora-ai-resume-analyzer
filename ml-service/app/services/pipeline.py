import numpy as np

class UserResumeScorerPipeline:
    """scikit-learn compatible pipeline wrapper for inference serialization."""
    def __init__(self, vectorizer, regressor):
        self.vectorizer = vectorizer
        self.regressor = regressor

    def predict(self, features_matrix: np.ndarray) -> np.ndarray:
        return self.regressor.predict(features_matrix)
