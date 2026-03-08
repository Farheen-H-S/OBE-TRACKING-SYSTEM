from rest_framework import serializers
from .models import TeachingPlan, TeachingPlanLecture


class TeachingPlanLectureSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingPlanLecture
        fields = '__all__'
        read_only_fields = ('lecture_id', 'teaching_plan_id')
        extra_kwargs = {
            'unit_no': {'required': False, 'default': 1},
        }


class TeachingPlanSerializer(serializers.ModelSerializer):
    lectures = TeachingPlanLectureSerializer(many=True, required=False)

    class Meta:
        model = TeachingPlan
        fields = '__all__'
        read_only_fields = ('teaching_plan_id',)

    def update(self, instance, validated_data):
        lectures_data = validated_data.pop('lectures', None)
        # Update TeachingPlan instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lectures_data is not None:
            # Simple approach: delete existing if list is provided? 
            # Or map by lecture_no? 
            # The UI sends the WHOLE list. 
            # Let's use a simple delete-and-recreate or update-by-no logic.
            # To be safe and simple given the UI sends the whole state:
            existing_lectures = {l.lecture_no: l for l in instance.lectures.all()}
            
            new_lecture_nos = [l.get('lecture_no') for l in lectures_data]
            
            # Delete lectures not in the new list
            for l_no in existing_lectures:
                if l_no not in new_lecture_nos:
                    existing_lectures[l_no].delete()

            for lecture_data in lectures_data:
                l_no = lecture_data.get('lecture_no')
                # Filter out fields that shouldn't be updated via setattr directly
                filtered_data = {k: v for k, v in lecture_data.items() if k not in ['teaching_plan_id', 'lecture_id']}
                
                if l_no in existing_lectures:
                    # Update
                    lec_obj = existing_lectures[l_no]
                    for attr, value in filtered_data.items():
                        setattr(lec_obj, attr, value)
                    lec_obj.save()
                else:
                    # Create
                    TeachingPlanLecture.objects.create(teaching_plan_id=instance, **filtered_data)
        
        return instance
