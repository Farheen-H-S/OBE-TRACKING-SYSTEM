from django.db import migrations, models
import django.db.models.deletion
import django.core.validators

class Migration(migrations.Migration):

    dependencies = [
        ('stress', '0001_initial'),
        ('academics', '0001_initial'), # Assuming academics exists
    ]

    operations = [
        migrations.RenameModel(
            old_name='StressSurvey',
            new_name='StressMaster',
        ),
        migrations.AddField(
            model_name='stressquestion',
            name='is_reverse',
            field=models.BooleanField(default=False, help_text="If true, high score (4) is good/positive. If false, high score (4) is stress."),
        ),
        migrations.AddField(
            model_name='stressresponse',
            name='batch_id',
            field=models.ForeignKey(blank=True, db_column='batch_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stress_responses', to='academics.batch'),
        ),
        migrations.AlterField(
            model_name='stresscategory',
            name='name',
            field=models.CharField(help_text='Academic/Emotional/Lifestyle', max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='stressresponse',
            name='response_value',
            field=models.IntegerField(help_text='Scale 0-4', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(4)]),
        ),
        migrations.AlterUniqueTogether(
            name='stressresponse',
            unique_together={('token', 'question_id')},
        ),
        migrations.AlterUniqueTogether(
            name='stressquestion',
            unique_together={('survey_id', 'question_text')},
        ),
    ]
