import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PinCode } from './example-tel-input/example-tel-input-example';

/** @title Form field with custom telephone number input control. */
@Component( {
  selector: 'form-field-custom-control-example',
  templateUrl: 'form-field-custom-control-example.html',
} )
export class FormFieldCustomControlExample implements OnInit {
  form: FormGroup = new FormGroup( {
    tel: new FormControl( new PinCode( '' ) ),
  } );

  ngOnInit() {
    setTimeout(
      () => {
        this.form.get( 'tel' )
          ?.setErrors( { 'invalid': true } );
      },
      2000 );
  }
}
