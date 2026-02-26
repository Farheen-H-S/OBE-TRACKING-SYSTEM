from django.contrib.auth.tokens import PasswordResetTokenGenerator

class CustomTokenGenerator(PasswordResetTokenGenerator):
    """
    Custom password reset token generator to integrate with the distinct User model.
    It relies entirely on the user's pk, password hash, and the login timestamp.
    If a user resets their password, the password hash changes, inherently invalidating this token.
    """
    def _make_hash_value(self, user, timestamp):
        # We also factor in the is_active status so that if an account is disabled
        # the token becomes invalid.
        return (
            str(user.pk) + user.password + str(timestamp) + str(user.is_active)
        )

# Instantiate the generator
custom_token_generator = CustomTokenGenerator()
