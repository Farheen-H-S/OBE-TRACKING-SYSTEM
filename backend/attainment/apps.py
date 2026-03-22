from django.apps import AppConfig


class AttainmentConfig(AppConfig):
    name = 'attainment'

    def ready(self):
        import attainment.signals
