import "styled-components";

declare module "styled-components" {
	export interface DefaultTheme {
		base: string;
		baseHover: string;
		main: string;
		mainHover: string;
		sub: string;
		subHover: string;
		text: string;
		textHover: string;
		accent: string;
		accentHover: string;
	}
}
